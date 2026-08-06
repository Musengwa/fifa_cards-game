import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase clients
const getSupabaseAdmin = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const getSupabaseClient = () => createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage buckets on startup
const PROFILE_PIC_BUCKET = 'make-44e0fa0c-profile-pics';
const GROUP_IMAGE_BUCKET = 'make-44e0fa0c-group-images';

(async () => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: buckets } = await supabase.storage.listBuckets();

    // Create profile pics bucket
    const profileBucketExists = buckets?.some(bucket => bucket.name === PROFILE_PIC_BUCKET);
    if (!profileBucketExists) {
      await supabase.storage.createBucket(PROFILE_PIC_BUCKET, { public: false });
      console.log(`Created bucket: ${PROFILE_PIC_BUCKET}`);
    }

    // Create group images bucket
    const groupBucketExists = buckets?.some(bucket => bucket.name === GROUP_IMAGE_BUCKET);
    if (!groupBucketExists) {
      await supabase.storage.createBucket(GROUP_IMAGE_BUCKET, { public: false });
      console.log(`Created bucket: ${GROUP_IMAGE_BUCKET}`);
    }
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
})();

// Helper to verify auth
const verifyAuth = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
};

// Looks up raw kv_store keys by prefix (kv_store.tsx's getByPrefix only returns
// values), so cascading deletes can target the exact rows without guessing.
const getKeysByPrefix = async (prefix: string): Promise<string[]> => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('kv_store_44e0fa0c')
    .select('key')
    .like('key', `${prefix}%`);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row: any) => row.key);
};

// Deletes a group and everything scoped to it (ratings, votes, invites), and
// unlinks it from every member's group list.
const deleteGroupCascade = async (group: any) => {
  await Promise.all(
    (group.memberIds || []).map(async (memberId: string) => {
      const memberGroups = await kv.get(`userGroups:${memberId}`) || [];
      await kv.set(`userGroups:${memberId}`, memberGroups.filter((id: string) => id !== group.id));
    })
  );

  const [ratingKeys, voteKeys, inviteKeys] = await Promise.all([
    getKeysByPrefix(`rating:${group.id}:`),
    getKeysByPrefix(`vote:${group.id}:`),
    getKeysByPrefix(`invite:${group.id}:`),
  ]);

  await kv.mdel([...ratingKeys, ...voteKeys, ...inviteKeys, `group:${group.id}`]);
};

// Health check endpoint
app.get("/make-server-44e0fa0c/health", (c) => {
  return c.json({ status: "ok" });
});

// AUTH ENDPOINTS

// Sign up
app.post("/make-server-44e0fa0c/auth/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    const supabaseAdmin = getSupabaseAdmin();

    console.log('Creating user in Supabase Auth...', { email, name });
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server isn't configured
      user_metadata: { name }
    });

    if (error) {
      console.error('Error creating user during signup:', error);
      return c.json({ error: `Auth error: ${error.message}` }, 400);
    }

    console.log('User created in Auth, saving to KV store...', data.user.id);

    // Store user profile
    try {
      await kv.set(`user:${data.user.id}`, {
        id: data.user.id,
        email,
        name,
        profilePicUrl: null,
        createdAt: new Date().toISOString()
      });
      console.log('User profile saved to KV store');
    } catch (kvError: any) {
      console.error('KV store error during signup:', kvError);
      return c.json({
        error: `Database error: ${kvError.message}. Please ensure the kv_store_44e0fa0c table exists in your Supabase database.`
      }, 500);
    }

    // Now sign in the user using the anon client to get a session
    const supabaseClient = getSupabaseClient();
    console.log('Signing in user to get session...');
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      console.error('Error signing in after user creation:', sessionError);
      // User was created but couldn't sign in - return user data anyway
      return c.json({
        user: data.user,
        warning: 'User created but automatic sign-in failed. Please sign in manually.',
        signInError: sessionError.message
      });
    }

    console.log('Session created successfully');
    return c.json({
      user: data.user,
      session: sessionData.session,
      access_token: sessionData.session?.access_token
    });
  } catch (error: any) {
    console.error('Unexpected error in signup endpoint:', error);
    return c.json({ error: `Signup failed: ${error.message || 'Unknown error'}` }, 500);
  }
});

// USER ENDPOINTS

// Get current user profile
app.get("/make-server-44e0fa0c/user/profile", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${userId}`);
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put("/make-server-44e0fa0c/user/profile", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const profile = await kv.get(`user:${userId}`);

    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const allowedFields = ['name', 'club', 'clubLogoUrl', 'nationality', 'nationalityFlagUrl'] as const;
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }

    const updatedProfile = { ...profile, ...updates };
    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Upload profile picture
app.post("/make-server-44e0fa0c/user/upload-profile-pic", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(PROFILE_PIC_BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading profile picture:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(PROFILE_PIC_BUCKET)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    const profile = await kv.get(`user:${userId}`);
    const updatedProfile = { ...profile, profilePicUrl: signedUrlData?.signedUrl };
    await kv.set(`user:${userId}`, updatedProfile);

    return c.json({ profilePicUrl: signedUrlData?.signedUrl, fileName });
  } catch (error) {
    console.error('Error in upload profile pic endpoint:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Delete the current user's account: leaves/deletes their groups, scrubs their
// own ratings/votes/invites, then removes the profile and the auth record itself.
app.delete("/make-server-44e0fa0c/user/account", async (c: any) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupIds: string[] = await kv.get(`userGroups:${userId}`) || [];
    const groups = await kv.mget(groupIds.map((id) => `group:${id}`));

    for (const group of groups) {
      if (!group) continue;

      if (group.creatorId === userId) {
        await deleteGroupCascade(group);
        continue;
      }

      group.memberIds = (group.memberIds || []).filter((id: string) => id !== userId);
      await kv.set(`group:${group.id}`, group);

      const myRatingKeys = await getKeysByPrefix(`rating:${group.id}:${userId}:`);
      await kv.mdel([...myRatingKeys, `vote:${group.id}:${userId}`]);
    }

    // Clean up any pending invites addressed to this user.
    const allInviteKeys = await getKeysByPrefix('invite:');
    const myInviteKeys = allInviteKeys.filter((key) => key.endsWith(`:${userId}`));

    await kv.mdel([...myInviteKeys, `user:${userId}`, `userGroups:${userId}`]);

    const supabaseAdmin = getSupabaseAdmin();
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      return c.json({ error: 'Account data was removed, but deleting the login record failed. Contact support.' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return c.json({ error: 'Failed to delete account' }, 500);
  }
});

// Search users by name or email
app.get("/make-server-44e0fa0c/user/search", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const query = c.req.query('q')?.toLowerCase() || '';
    if (!query) {
      return c.json({ users: [] });
    }

    const allUsers = await kv.getByPrefix('user:');
    const matchingUsers = allUsers
      .filter((u: any) => 
        u.id !== userId && (
          u.name?.toLowerCase().includes(query) || 
          u.email?.toLowerCase().includes(query)
        )
      )
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        profilePicUrl: u.profilePicUrl
      }));

    return c.json({ users: matchingUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// GROUP ENDPOINTS

// Create group
app.post("/make-server-44e0fa0c/group/create", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, attributes, awardCategories, description } = await c.req.json();

    if (!name || !attributes || !awardCategories) {
      return c.json({ error: 'Name, attributes, and award categories are required' }, 400);
    }

    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const group = {
      id: groupId,
      name,
      description: description || '',
      groupImageUrl: null,
      creatorId: userId,
      attributes, // [{ id, name }]
      awardCategories, // [{ id, name }]
      cardsReleased: false,
      analyticsVisible: false,
      sessionEnded: false,
      memberIds: [userId],
      createdAt: new Date().toISOString()
    };

    await kv.set(`group:${groupId}`, group);

    // Add to user's groups
    const userGroups = await kv.get(`userGroups:${userId}`) || [];
    userGroups.push(groupId);
    await kv.set(`userGroups:${userId}`, userGroups);

    return c.json({ group });
  } catch (error) {
    console.error('Error creating group:', error);
    return c.json({ error: 'Failed to create group' }, 500);
  }
});

// Get group by ID
app.get("/make-server-44e0fa0c/group/:groupId", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if user is member
    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    return c.json({ group });
  } catch (error) {
    console.error('Error fetching group:', error);
    return c.json({ error: 'Failed to fetch group' }, 500);
  }
});

// Get all groups for user
app.get("/make-server-44e0fa0c/user/groups", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupIds = await kv.get(`userGroups:${userId}`) || [];
    const groups = await kv.mget(groupIds.map((id: string) => `group:${id}`));

    return c.json({ groups: groups.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return c.json({ error: 'Failed to fetch groups' }, 500);
  }
});

// Join group via invite
app.post("/make-server-44e0fa0c/group/:groupId/join", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Add user to group if not already a member
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
      await kv.set(`group:${groupId}`, group);

      // Add to user's groups
      const userGroups = await kv.get(`userGroups:${userId}`) || [];
      if (!userGroups.includes(groupId)) {
        userGroups.push(groupId);
        await kv.set(`userGroups:${userId}`, userGroups);
      }
    }

    return c.json({ group });
  } catch (error) {
    console.error('Error joining group:', error);
    return c.json({ error: 'Failed to join group' }, 500);
  }
});

// Get public group preview (for invitation links - no membership required)
app.get("/make-server-44e0fa0c/group/:groupId/preview", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Return public info only (no sensitive data like ratings, votes, etc.)
    const publicInfo = {
      id: group.id,
      name: group.name,
      description: group.description || null,
      imageUrl: group.groupImageUrl || null,
      memberCount: group.memberIds?.length || 0,
      createdAt: group.createdAt,
      creatorId: group.creatorId,
      isMember: group.memberIds?.includes(userId) || false
    };

    return c.json({ group: publicInfo });
  } catch (error) {
    console.error('Error fetching group preview:', error);
    return c.json({ error: 'Failed to fetch group preview' }, 500);
  }
});

// Update group settings (creator only)
app.put("/make-server-44e0fa0c/group/:groupId/settings", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (group.creatorId !== userId) {
      return c.json({ error: 'Only the creator can update settings' }, 403);
    }

    const { cardsReleased, analyticsVisible, description, sessionEnded } = await c.req.json();

    if (cardsReleased !== undefined) group.cardsReleased = cardsReleased;
    if (analyticsVisible !== undefined) group.analyticsVisible = analyticsVisible;
    if (description !== undefined) group.description = description;
    if (sessionEnded !== undefined) group.sessionEnded = sessionEnded;

    await kv.set(`group:${groupId}`, group);

    return c.json({ group });
  } catch (error) {
    console.error('Error updating group settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Delete group (creator only)
app.delete("/make-server-44e0fa0c/group/:groupId", async (c: any) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (group.creatorId !== userId) {
      return c.json({ error: 'Only the creator can delete this group' }, 403);
    }

    await deleteGroupCascade(group);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return c.json({ error: 'Failed to delete group' }, 500);
  }
});

// Upload group image (creator only)
app.post("/make-server-44e0fa0c/group/:groupId/upload-image", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);

    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (group.creatorId !== userId) {
      return c.json({ error: 'Only the creator can upload group image' }, 403);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const supabase = getSupabaseAdmin();
    const fileExt = file.name.split('.').pop();
    const fileName = `${groupId}-${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(GROUP_IMAGE_BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading group image:', error);
      return c.json({ error: 'Upload failed' }, 500);
    }

    // Get signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(GROUP_IMAGE_BUCKET)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

    group.groupImageUrl = signedUrlData?.signedUrl;
    await kv.set(`group:${groupId}`, group);

    return c.json({ groupImageUrl: signedUrlData?.signedUrl, fileName });
  } catch (error) {
    console.error('Error in upload group image endpoint:', error);
    return c.json({ error: 'Upload failed' }, 500);
  }
});

// Get group members with profiles
app.get("/make-server-44e0fa0c/group/:groupId/members", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    const memberProfiles = await kv.mget(
      group.memberIds.map((id: string) => `user:${id}`)
    );

    return c.json({ members: memberProfiles.filter(Boolean) });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return c.json({ error: 'Failed to fetch members' }, 500);
  }
});

// RATING ENDPOINTS

// Submit ratings
app.post("/make-server-44e0fa0c/rating/submit", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId, toUserId, ratings, stars } = await c.req.json();

    if (!groupId || !toUserId || !ratings) {
      return c.json({ error: 'Group ID, target user ID, and ratings are required' }, 400);
    }

    if (stars !== undefined && (typeof stars !== 'number' || stars < 0 || stars > 5 || (stars * 2) % 1 !== 0)) {
      return c.json({ error: 'Stars must be a number 0-5 in half-star increments' }, 400);
    }

    // Prevent self-rating
    if (userId === toUserId) {
      return c.json({ error: 'Cannot rate yourself' }, 400);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (group.sessionEnded) {
      return c.json({ error: 'Session has ended. Rating is permanently closed.' }, 403);
    }

    if (!group.memberIds.includes(userId) || !group.memberIds.includes(toUserId)) {
      return c.json({ error: 'Both users must be members of the group' }, 403);
    }

    const ratingKey = `rating:${groupId}:${userId}:${toUserId}`;
    const rating = {
      groupId,
      fromUserId: userId,
      toUserId,
      ratings, // { attributeId: value }
      stars: typeof stars === 'number' ? stars : undefined, // 0-5 in 0.5 steps, overall peer star rating
      timestamp: new Date().toISOString()
    };

    await kv.set(ratingKey, rating);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return c.json({ error: 'Failed to submit rating' }, 500);
  }
});

// Get all ratings for a group
app.get("/make-server-44e0fa0c/group/:groupId/ratings", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Only show ratings if cards are released OR user is creator
    if (!group.cardsReleased && group.creatorId !== userId) {
      return c.json({ ratings: [] });
    }

    const allRatings = await kv.getByPrefix(`rating:${groupId}:`);

    // Calculate average ratings for each user
    const userRatings: any = {};
    const userStars: any = {};

    allRatings.forEach((rating: any) => {
      if (!userRatings[rating.toUserId]) {
        userRatings[rating.toUserId] = {};
      }

      Object.entries(rating.ratings).forEach(([attrId, value]: [string, any]) => {
        if (!userRatings[rating.toUserId][attrId]) {
          userRatings[rating.toUserId][attrId] = [];
        }
        userRatings[rating.toUserId][attrId].push(value);
      });

      if (typeof rating.stars === 'number') {
        if (!userStars[rating.toUserId]) userStars[rating.toUserId] = [];
        userStars[rating.toUserId].push(rating.stars);
      }
    });

    // Calculate averages
    const averages: any = {};
    Object.entries(userRatings).forEach(([toUserId, attrs]: [string, any]) => {
      averages[toUserId] = {};
      Object.entries(attrs).forEach(([attrId, values]: [string, any]) => {
        const sum = values.reduce((a: number, b: number) => a + b, 0);
        averages[toUserId][attrId] = sum / values.length;
      });
    });

    // Star rating: the percentage of total possible stars (5 per voter) actually
    // given, mapped back onto a 5-star scale and rounded to the nearest half star.
    const starRatings: any = {};
    Object.entries(userStars).forEach(([toUserId, values]: [string, any]) => {
      const totalGiven = values.reduce((a: number, b: number) => a + b, 0);
      const totalPossible = values.length * 5;
      const percentage = totalPossible > 0 ? totalGiven / totalPossible : 0;
      const average = Math.round(percentage * 5 * 2) / 2;
      starRatings[toUserId] = { average, percentage, count: values.length };
    });

    return c.json({ ratings: allRatings, averages, starRatings });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return c.json({ error: 'Failed to fetch ratings' }, 500);
  }
});

// Get user's submitted ratings for a group
app.get("/make-server-44e0fa0c/group/:groupId/my-ratings", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const myRatings = await kv.getByPrefix(`rating:${groupId}:${userId}:`);

    return c.json({ ratings: myRatings });
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return c.json({ error: 'Failed to fetch ratings' }, 500);
  }
});

// VOTING ENDPOINTS

// Submit votes
app.post("/make-server-44e0fa0c/vote/submit", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId, votes } = await c.req.json();
    
    if (!groupId || !votes) {
      return c.json({ error: 'Group ID and votes are required' }, 400);
    }

    // Check for self-voting
    if (Object.values(votes).includes(userId)) {
      return c.json({ error: 'Cannot vote for yourself' }, 400);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (group.sessionEnded) {
      return c.json({ error: 'Session has ended. Voting is permanently closed.' }, 403);
    }

    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Must be a member of the group' }, 403);
    }

    const voteKey = `vote:${groupId}:${userId}`;
    const vote = {
      groupId,
      voterId: userId,
      votes, // { awardId: userId }
      timestamp: new Date().toISOString()
    };

    await kv.set(voteKey, vote);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return c.json({ error: 'Failed to submit vote' }, 500);
  }
});

// Get all votes for a group
app.get("/make-server-44e0fa0c/group/:groupId/votes", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const group = await kv.get(`group:${groupId}`);
    
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Not a member of this group' }, 403);
    }

    // Only show votes if analytics are visible OR user is creator
    if (!group.analyticsVisible && group.creatorId !== userId) {
      return c.json({ votes: [], results: {} });
    }

    const allVotes = await kv.getByPrefix(`vote:${groupId}:`);

    // Calculate vote counts
    const results: any = {};
    
    allVotes.forEach((vote: any) => {
      Object.entries(vote.votes).forEach(([awardId, votedUserId]: [string, any]) => {
        if (!results[awardId]) {
          results[awardId] = {};
        }
        if (!results[awardId][votedUserId]) {
          results[awardId][votedUserId] = 0;
        }
        results[awardId][votedUserId]++;
      });
    });

    return c.json({ votes: allVotes, results });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return c.json({ error: 'Failed to fetch votes' }, 500);
  }
});

// Get user's submitted votes for a group
app.get("/make-server-44e0fa0c/group/:groupId/my-votes", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const groupId = c.req.param('groupId');
    const myVote = await kv.get(`vote:${groupId}:${userId}`);

    return c.json({ vote: myVote });
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return c.json({ error: 'Failed to fetch vote' }, 500);
  }
});

// INVITATION ENDPOINTS

// Send invitation to a user
app.post("/make-server-44e0fa0c/invite/send", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId, toUserId } = await c.req.json();

    if (!groupId || !toUserId) {
      return c.json({ error: 'Group ID and recipient user ID are required' }, 400);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Check if sender is a member
    if (!group.memberIds.includes(userId)) {
      return c.json({ error: 'Must be a member to send invites' }, 403);
    }

    // Check if recipient is already a member
    if (group.memberIds.includes(toUserId)) {
      return c.json({ error: 'User is already a member' }, 400);
    }

    // Check if invite already exists
    const existingInvite = await kv.get(`invite:${groupId}:${toUserId}`);
    if (existingInvite) {
      return c.json({ error: 'Invitation already sent' }, 400);
    }

    const invite = {
      id: `${groupId}:${toUserId}`,
      groupId,
      fromUserId: userId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(`invite:${groupId}:${toUserId}`, invite);

    return c.json({ invite });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

// Get pending invitations for current user
app.get("/make-server-44e0fa0c/invite/pending", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allInvites = await kv.getByPrefix('invite:');
    const pendingInvites = allInvites.filter(
      (invite: any) => invite.toUserId === userId && invite.status === 'pending'
    );

    // Fetch group details for each invite
    const invitesWithDetails = await Promise.all(
      pendingInvites.map(async (invite: any) => {
        const group = await kv.get(`group:${invite.groupId}`);
        const sender = await kv.get(`user:${invite.fromUserId}`);
        return {
          ...invite,
          groupName: group?.name,
          groupDescription: group?.description,
          groupImageUrl: group?.groupImageUrl,
          memberCount: group?.memberIds?.length || 0,
          senderName: sender?.name,
          senderEmail: sender?.email
        };
      })
    );

    return c.json({ invites: invitesWithDetails });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return c.json({ error: 'Failed to fetch invitations' }, 500);
  }
});

// Accept invitation
app.post("/make-server-44e0fa0c/invite/accept", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = await c.req.json();

    if (!groupId) {
      return c.json({ error: 'Group ID is required' }, 400);
    }

    const invite = await kv.get(`invite:${groupId}:${userId}`);
    if (!invite || invite.status !== 'pending') {
      return c.json({ error: 'Invitation not found or already processed' }, 404);
    }

    const group = await kv.get(`group:${groupId}`);
    if (!group) {
      return c.json({ error: 'Group not found' }, 404);
    }

    // Add user to group
    if (!group.memberIds.includes(userId)) {
      group.memberIds.push(userId);
      await kv.set(`group:${groupId}`, group);
    }

    // Add group to user's groups
    const userGroups = await kv.get(`userGroups:${userId}`) || [];
    if (!userGroups.includes(groupId)) {
      userGroups.push(groupId);
      await kv.set(`userGroups:${userId}`, userGroups);
    }

    // Update invite status
    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();
    await kv.set(`invite:${groupId}:${userId}`, invite);

    return c.json({ group });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

// Decline invitation
app.post("/make-server-44e0fa0c/invite/decline", async (c) => {
  try {
    const userId = await verifyAuth(c.req.header('Authorization'));
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { groupId } = await c.req.json();

    if (!groupId) {
      return c.json({ error: 'Group ID is required' }, 400);
    }

    const invite = await kv.get(`invite:${groupId}:${userId}`);
    if (!invite || invite.status !== 'pending') {
      return c.json({ error: 'Invitation not found or already processed' }, 404);
    }

    // Update invite status
    invite.status = 'declined';
    invite.declinedAt = new Date().toISOString();
    await kv.set(`invite:${groupId}:${userId}`, invite);

    return c.json({ success: true });
  } catch (error) {
    console.error('Error declining invitation:', error);
    return c.json({ error: 'Failed to decline invitation' }, 500);
  }
});

Deno.serve(app.fetch);