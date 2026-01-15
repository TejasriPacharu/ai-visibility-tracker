import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Sparkles, ArrowRight } from 'lucide-react';
import { useCreateProject } from '../hooks/useApi';
import { Breadcrumb } from '../components/Layout';
import { Card, Button, Input, Badge, Spinner } from '../components/ui';

export default function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    userBrand: '',
    competitors: [],
  });
  const [newCompetitor, setNewCompetitor] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.userBrand.trim()) newErrors.userBrand = 'Your brand name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await createProject.mutateAsync({
        name: formData.name.trim(),
        category: formData.category.trim(),
        userBrand: formData.userBrand.trim(),
        competitors: formData.competitors,
      });
      
      navigate(`/projects/${result.project.id}`);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  const addCompetitor = () => {
    const competitor = newCompetitor.trim();
    if (competitor && !formData.competitors.includes(competitor) && competitor !== formData.userBrand) {
      setFormData(prev => ({
        ...prev,
        competitors: [...prev.competitors, competitor],
      }));
      setNewCompetitor('');
    }
  };

  const removeCompetitor = (competitor) => {
    setFormData(prev => ({
      ...prev,
      competitors: prev.competitors.filter(c => c !== competitor),
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCompetitor();
    }
  };

  // Category suggestions
  const categorySuggestions = [
    'CRM software',
    'Project management tools',
    'Email marketing platforms',
    'E-commerce platforms',
    'Cloud storage services',
    'Video conferencing tools',
    'Accounting software',
    'HR management systems',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'Projects', href: '/projects' },
        { label: 'New Project' },
      ]} />

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ backgroundColor: 'rgb(59 130 246 / 0.1)' }}>
          <Sparkles className="w-8 h-8 text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Create New Project</h1>
        <p className="mt-2" style={{ color: 'var(--color-navy-400)' }}>
          Set up a project to track your brand's AI visibility
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Name */}
          <Input
            label="Project Name"
            placeholder="e.g., My CRM Brand Tracking"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            error={errors.name}
          />

          {/* Category */}
          <div className="space-y-2">
            <Input
              label="Category / Industry"
              placeholder="e.g., CRM software, project management tools"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              error={errors.category}
            />
            <div className="flex flex-wrap gap-2">
              {categorySuggestions.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: suggestion }))}
                  className="px-3 py-1 text-xs rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--color-navy-800)', color: 'var(--color-navy-300)' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Your Brand */}
          <Input
            label="Your Brand Name"
            placeholder="e.g., Acme CRM"
            value={formData.userBrand}
            onChange={(e) => setFormData(prev => ({ ...prev, userBrand: e.target.value }))}
            error={errors.userBrand}
          />

          {/* Competitors */}
          <div className="space-y-3">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-navy-300)' }}>
              Competitors to Track
            </label>
            
            <div className="flex gap-2">
              <Input
                placeholder="Add competitor name"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addCompetitor}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.competitors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.competitors.map((competitor) => (
                  <Badge key={competitor} variant="primary" className="flex items-center gap-1.5 py-1.5">
                    {competitor}
                    <button
                      type="button"
                      onClick={() => removeCompetitor(competitor)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs" style={{ color: 'var(--color-navy-500)' }}>
              Add 3-5 competitors for meaningful comparison. You can add more later.
            </p>
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgb(239 68 68 / 0.1)', border: '1px solid rgb(239 68 68 / 0.2)' }}>
              <p className="text-sm text-red-400">{errors.submit}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={createProject.isPending}
            >
              Create Project
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>

      {/* Info card */}
      <Card className="p-6" style={{ backgroundColor: 'rgb(16 42 67 / 0.3)' }}>
        <h3 className="font-medium text-white mb-2">What happens next?</h3>
        <ul className="space-y-2 text-sm" style={{ color: 'var(--color-navy-400)' }}>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">1.</span>
            We'll generate 25 relevant prompts based on your category
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">2.</span>
            You can customize prompts or add your own
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">3.</span>
            Run an analysis to see how AI models mention your brand
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">4.</span>
            Get insights on visibility, sentiment, and citations
          </li>
        </ul>
      </Card>
    </div>
  );
}