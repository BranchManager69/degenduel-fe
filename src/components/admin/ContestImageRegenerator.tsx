import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { admin } from '../../services/api/admin';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { LoadingSpinner } from '../ui/Spinner';

interface ArtStyle {
  id: string;
  description: string;
}

export const ContestImageRegenerator: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [styles, setStyles] = useState<ArtStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch the contest details to get the current image
        const response = await fetch(`/api/contests/${contestId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch contest details');
        }
        
        const contestData = await response.json();
        setCurrentImageUrl(contestData.image_url || null);
        
        // Fetch available art styles
        const artStylesResponse = await admin.contestImages.getArtStyles();
        setStyles(artStylesResponse.styles);
        
        if (artStylesResponse.styles.length > 0) {
          setSelectedStyle(artStylesResponse.styles[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [contestId]);

  const handleRegenerateImage = async () => {
    try {
      setRegenerating(true);
      setError(null);
      
      const result = await admin.contestImages.regenerate(
        Number(contestId),
        selectedStyle
      );
      
      if (result.success) {
        setNewImageUrl(result.data.image_url);
      } else {
        throw new Error('Failed to regenerate image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error regenerating image:', err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-100">
              Contest Image Regeneration
            </h2>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="text-gray-400 border-gray-400 hover:bg-gray-400/10"
            >
              Back
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <div className="bg-red-500/20 text-red-400 p-4 rounded-md border border-red-500/30">
              {error}
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Current Image */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-200">Current Image</h3>
                  {currentImageUrl ? (
                    <div className="relative aspect-square bg-dark-300 rounded-lg overflow-hidden">
                      <img 
                        src={currentImageUrl} 
                        alt="Current contest image" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-dark-300 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>

                {/* New Image (after regeneration) */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-200">New Image</h3>
                  {regenerating ? (
                    <div className="aspect-square bg-dark-300 rounded-lg flex flex-col items-center justify-center">
                      <LoadingSpinner size="lg" />
                      <p className="text-gray-400 mt-4">Generating image...</p>
                      <p className="text-gray-500 text-sm mt-2">This may take 15-30 seconds</p>
                    </div>
                  ) : newImageUrl ? (
                    <div className="relative aspect-square bg-dark-300 rounded-lg overflow-hidden">
                      <img 
                        src={newImageUrl} 
                        alt="New contest image" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-dark-300 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">New image will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Art Style Selection */}
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-200">Art Style</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg text-left transition-colors ${
                        selectedStyle === style.id
                          ? 'bg-brand-500/20 border border-brand-500/30 text-brand-400'
                          : 'bg-dark-300/50 border border-dark-400 text-gray-300 hover:bg-dark-400/50'
                      }`}
                    >
                      <p className="font-medium">{style.id}</p>
                      <p className="text-xs mt-1 line-clamp-2 opacity-70">
                        {style.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleRegenerateImage}
                  disabled={regenerating || !selectedStyle}
                  className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-2"
                >
                  {regenerating ? (
                    <span className="flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </span>
                  ) : (
                    'Regenerate Image'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};