# Test Group Setup Instructions

## Test Creator Account

**Email:** `creator@test.com`  
**Password:** `test123456`  
**Name:** Creator User

## Test Member Accounts

1. **Email:** `member1@test.com` | **Password:** `test123456` | **Name:** Alice Johnson
2. **Email:** `member2@test.com` | **Password:** `test123456` | **Name:** Bob Smith
3. **Email:** `member3@test.com` | **Password:** `test123456` | **Name:** Charlie Davis
4. **Email:** `member4@test.com` | **Password:** `test123456` | **Name:** Diana Martinez

## Setup Steps

### 1. Create Test Users

Sign up with each of the accounts above:
- Go to the landing page
- Click "Sign Up" tab
- Enter the credentials for each user
- Repeat for all 5 users

### 2. Create Test Group (as Creator)

1. Sign in with `creator@test.com`
2. Click "Create New Group"
3. Fill in:
   - **Group Name:** "Test FIFA Rankings 2026"
   - **Description:** "A test group for rating our squad"
   - **Attributes:** Pace, Shooting, Passing, Defense, Dribbling
   - **Awards:** Best Player, Most Improved, Best Defender, Top Scorer
4. Upload a group image (optional)
5. Click "Create Group"

### 3. Invite Members

1. In the group page, click "Invite"
2. Copy the invite link
3. Share with other test accounts OR
4. Search for members by email and send them the link

### 4. Join Group (as each member)

1. Sign in with each member account
2. Use the invite link or navigate to `/join/{groupId}`
3. Click "Join Group"

### 5. Upload Profile Pictures

For each user:
1. Go to Dashboard
2. Click on profile/settings
3. Upload a profile picture

### 6. Test Rating Flow

As each member:
1. Go to the group
2. Go to "Rate Members" tab
3. Rate each other member on all attributes

### 7. Test Voting Flow

As each member:
1. Go to "Vote" tab
2. Vote for different members for each award (can't vote for yourself)

### 8. Creator Controls

As creator:
1. Click "Settings"
2. Toggle "Release Cards" - members can now see their FIFA cards
3. Toggle "Show Analytics" - members can see voting results

## Quick Commands for Testing

You can use the `/test` page to:
- Test signup functionality
- Test Supabase connection
- View error logs

## Notes

- All test users use the same password: `test123456`
- The creator account controls when cards and analytics are visible
- Members cannot see ratings until creator releases cards
- Members cannot see vote results until creator shows analytics
