import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Plus, X, Star } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '../lib/supabase';
import { isMainAward, formatAwardName } from '../lib/awards';
import { toast } from 'sonner';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState([
    { id: '1', name: 'Pace' },
    { id: '2', name: 'Shooting' },
    { id: '3', name: 'Passing' },
  ]);
  const [newAttribute, setNewAttribute] = useState('');
  const [awardCategories, setAwardCategories] = useState([
    { id: '1', name: 'Best Player' },
    { id: '2', name: 'Most Improved' },
  ]);
  const [newAward, setNewAward] = useState('');
  const [newAwardIsMain, setNewAwardIsMain] = useState(false);

  const addAttribute = () => {
    if (newAttribute.trim()) {
      setAttributes([
        ...attributes,
        { id: Date.now().toString(), name: newAttribute.trim() },
      ]);
      setNewAttribute('');
    }
  };

  const removeAttribute = (id: string) => {
    setAttributes(attributes.filter((attr) => attr.id !== id));
  };

  const addAward = () => {
    if (newAward.trim()) {
      const name = newAward.trim() + (newAwardIsMain ? ' (main)' : '');
      setAwardCategories([
        ...awardCategories,
        { id: Date.now().toString(), name },
      ]);
      setNewAward('');
      setNewAwardIsMain(false);
    }
  };

  const removeAward = (id: string) => {
    setAwardCategories(awardCategories.filter((award) => award.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    if (attributes.length === 0) {
      toast.error('Please add at least one attribute');
      return;
    }

    if (awardCategories.length === 0) {
      toast.error('Please add at least one award category');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/group/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: groupName,
          description,
          attributes,
          awardCategories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group');
      }

      toast.success('Group created successfully!');
      navigate(`/group/${data.group.id}`);
    } catch (error: any) {
      console.error('Error creating group:', error);
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="text-white mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            <CardDescription>
              Set up a new ranking event with custom attributes and awards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Group Name */}
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name *</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Friends FIFA Rankings 2026"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Describe your group (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Attributes */}
              <div className="space-y-3">
                <Label>Rating Attributes *</Label>
                <p className="text-sm text-gray-500">
                  Define the attributes that users will rate each other on (e.g., Speed, Skills, etc.)
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new attribute"
                    value={newAttribute}
                    onChange={(e) => setNewAttribute(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttribute())}
                  />
                  <Button type="button" onClick={addAttribute}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {attributes.map((attr) => (
                    <div
                      key={attr.id}
                      className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full"
                    >
                      <span>{attr.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.id)}
                        className="hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Award Categories */}
              <div className="space-y-3">
                <Label>Award Categories *</Label>
                <p className="text-sm text-gray-500">
                  Create custom awards that users can vote on (e.g., Best Dressed, MVP, etc.)
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add new award"
                    value={newAward}
                    onChange={(e) => setNewAward(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                  />
                  <Button type="button" onClick={addAward}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-500">
                  <Checkbox
                    checked={newAwardIsMain}
                    onCheckedChange={(checked) => setNewAwardIsMain(checked === true)}
                  />
                  Main award (e.g. Ballon d'Or) — shown bigger, with extra confetti
                </label>
                <div className="flex flex-wrap gap-2 mt-3">
                  {awardCategories.map((award) => {
                    const main = isMainAward(award.name);
                    return (
                      <div
                        key={award.id}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          main
                            ? 'bg-amber-200 text-amber-900 ring-2 ring-amber-400'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {main && <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />}
                        <span>{formatAwardName(award.name)}</span>
                        {main && <span className="text-[10px] font-bold uppercase tracking-wide">Main</span>}
                        <button
                          type="button"
                          onClick={() => removeAward(award.id)}
                          className="hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
