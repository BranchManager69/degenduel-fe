// src/components/admin/ContestImageRegenerator.tsx

/**
 * This component is used to regenerate a contest image.
 * 
 * It is a new component and has not yet been tested.
 * 
 * Image quality will be an issue, I think, until mid-April and then never again.
 * 
 * @author @BranchManager69
 * @since 2025-04-02
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { admin } from '../../services/api/admin';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { LoadingSpinner } from '../ui/Spinner';

// AI Art style interface
interface ArtStyle {
  id: string;
  description: string;
}

// Contest Image Regenerator
export const ContestImageRegenerator: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [styles, setStyles] = useState<ArtStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(false);
  const [applyInProgress, setApplyInProgress] = useState<boolean>(false);

  // Fetch the contest details to get the current image
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
        
        // Get the contest data
        const contestData = await response.json();
        setCurrentImageUrl(contestData.image_url || null);
        
        // Fetch available art styles
        const artStylesResponse = await admin.contestImages.getArtStyles();
        setStyles(artStylesResponse.styles);
        
        // Set the selected style to the first available style
        if (artStylesResponse.styles.length > 0) {
          setSelectedStyle(artStylesResponse.styles[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        // Set the loading state to false
        setLoading(false);
      }
    };
    
    fetchData();
  }, [contestId]);

  // Handle regenerate image
  const handleRegenerateImage = async () => {
    try {
      setRegenerating(true);
      setError(null);
      setPreviewImage(null);
      
      // If we have a new image, add it to history before generating a new one
      if (newImageUrl) {
        setImageHistory(prev => [...prev, newImageUrl]);
      }
      
      // Regenerate the image
      const result = await admin.contestImages.regenerate(
        Number(contestId),
        selectedStyle,
        showCustomPrompt ? customPrompt : undefined
      );

      // Set the new image URL
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
  
  // Apply the newly generated image to the contest
  const handleApplyImage = async () => {
    if (!newImageUrl) return;
    
    try {
      setApplyInProgress(true);
      setError(null);
      
      // Update the contest with the new image
      const response = await admin.updateContest(contestId as string, {
        image_url: newImageUrl
      });
      
      if (response) {
        // Update the current image
        setCurrentImageUrl(newImageUrl);
        setNewImageUrl(null);
        
        // Clear history
        setImageHistory([]);
        
        // Show toast or message
        alert('Image successfully applied to contest!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply image');
      console.error('Error applying image:', err);
    } finally {
      setApplyInProgress(false);
    }
  };
  
  // Use a previous image from history
  const usePreviousImage = (index: number) => {
    const imageUrl = imageHistory[index];
    
    if (imageUrl) {
      // Remove this image and all images after it from history
      setImageHistory(prev => prev.slice(0, index));
      
      // Set as the new image
      setNewImageUrl(imageUrl);
    }
  };
  
  // Open image preview modal
  const openPreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
  };
  
  // Close image preview modal
  const closePreview = () => {
    setPreviewImage(null);
    setCompareMode(false);
  };
  
  // Toggle comparison mode
  const toggleCompare = () => {
    if (currentImageUrl && newImageUrl) {
      setCompareMode(prev => !prev);
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
              <div className="relative">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Current Image */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-200">Current Image</h3>
                    {currentImageUrl ? (
                      <div 
                        className="relative aspect-square bg-dark-300 rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => openPreview(currentImageUrl)}
                      >
                        <img 
                          src={currentImageUrl} 
                          alt="Current contest image" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
                          </svg>
                        </div>
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
                      <div 
                        className="relative aspect-square bg-dark-300 rounded-lg overflow-hidden cursor-pointer group"
                        onClick={() => openPreview(newImageUrl)}
                      >
                        <img 
                          src={newImageUrl} 
                          alt="New contest image" 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square bg-dark-300 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">New image will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Compare Button - only show when both images are available */}
                {currentImageUrl && newImageUrl && (
                  <button
                    onClick={() => {
                      setPreviewImage(currentImageUrl);
                      setCompareMode(true);
                    }}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-brand-500/90 hover:bg-brand-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Compare</span>
                  </button>
                )}
              </div>

              {/* Art Style & Prompt Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-200">Art Style</h3>
                  <button 
                    onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                    className="text-brand-400 hover:text-brand-300 text-sm flex items-center space-x-1"
                  >
                    <span>{showCustomPrompt ? 'Hide Custom Prompt' : 'Show Custom Prompt'}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={showCustomPrompt ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} 
                      />
                    </svg>
                  </button>
                </div>
                
                {/* Custom Prompt Input */}
                {showCustomPrompt && (
                  <div className="mb-4">
                    <label className="text-sm text-gray-300 mb-1 block">Custom Generation Prompt (Optional)</label>
                    <div className="relative">
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Describe details for the image you want to generate..."
                        className="w-full bg-dark-300 border border-dark-400 rounded-lg p-3 text-white text-sm min-h-[100px] focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
                      />
                      {customPrompt && (
                        <button 
                          className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
                          onClick={() => setCustomPrompt('')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use this field to provide additional details for the AI to consider when generating the image.
                    </p>
                  </div>
                )}
                
                {/* Art Style Selection */}
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
              
              {/* Image History */}
              {imageHistory.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-200">Generation History</h3>
                  <div className="flex flex-wrap gap-2">
                    {imageHistory.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="relative w-16 h-16 cursor-pointer group"
                        onClick={() => usePreviousImage(index)}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Generated image ${index + 1}`} 
                          className="w-full h-full object-cover rounded-md border border-dark-500"
                        />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center pt-4 space-x-4">
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
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate Image
                    </span>
                  )}
                </Button>
                
                {newImageUrl && (
                  <Button
                    onClick={handleApplyImage}
                    disabled={applyInProgress}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
                  >
                    {applyInProgress ? (
                      <span className="flex items-center">
                        <LoadingSpinner size="sm" className="mr-2" />
                        Applying...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Apply to Contest
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {compareMode && currentImageUrl && newImageUrl ? (
              <>
                <div className="relative">
                  {/* Comparison slider */}
                  <div className="relative w-full max-h-[85vh] bg-gray-900 border border-gray-700 rounded overflow-hidden">
                    {/* Original image (behind) */}
                    <img 
                      src={currentImageUrl} 
                      alt="Original image" 
                      className="w-full h-full object-contain" 
                    />
                    
                    {/* New image (slider overlay) */}
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex overflow-hidden">
                      <div className="h-full w-1/2 overflow-hidden relative border-r-2 border-brand-400">
                        <img 
                          src={newImageUrl} 
                          alt="New image" 
                          className="absolute top-0 left-0 h-full object-contain" 
                          style={{ width: "200%", maxWidth: "none" }}
                        />
                      </div>
                      <div className="absolute h-full w-0.5 bg-brand-400 left-1/2 transform -translate-x-1/2">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      Original
                    </div>
                    <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      New
                    </div>
                  </div>
                </div>
                
                {/* Controls */}
                <div className="flex justify-center mt-4 space-x-4">
                  <button 
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md transition-colors flex items-center space-x-2"
                    onClick={() => setCompareMode(false)}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Full Images</span>
                  </button>
                </div>
              </>
            ) : (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-w-full max-h-[85vh] object-contain" 
              />
            )}
            
            {/* Action buttons */}
            <div className="absolute top-4 right-4 flex space-x-2">
              {!compareMode && currentImageUrl && newImageUrl && (
                <button 
                  className="w-10 h-10 rounded-full bg-brand-500/80 flex items-center justify-center text-white hover:bg-brand-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCompare();
                  }}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </button>
              )}
              <button 
                className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                onClick={closePreview}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};