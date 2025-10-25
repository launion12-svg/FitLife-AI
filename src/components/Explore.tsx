
import React, { useState, useCallback } from 'react';
import { getGroundedResponse, getMapsResponse, generateImage, analyzeImage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { SearchIcon, LocationMarkerIcon, PhotographIcon, DocumentSearchIcon, UploadIcon } from './icons/Icons';
import { useLanguage } from '../contexts/LanguageContext';

type ExploreFeature = 'search' | 'maps' | 'imageGen' | 'progress';

export const Explore: React.FC = () => {
    const { t, language } = useLanguage();
    const [activeFeature, setActiveFeature] = useState<ExploreFeature>('search');
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ text: string, sources?: any[], imageUrl?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt && activeFeature === 'search') return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            if (activeFeature === 'search') {
                const response = await getGroundedResponse(prompt, language);
                setResult({ text: response.text, sources: response.sources });
            } else if (activeFeature === 'imageGen') {
                const imageUrl = await generateImage(prompt);
                setResult({ text: t('explore.imageGenResult'), imageUrl });
            } else if (activeFeature === 'maps') {
                navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    const query = prompt || t('explore.mapsDefaultQuery');
                    const response = await getMapsResponse(query, { latitude, longitude }, language);
                    setResult({ text: response.text, sources: response.sources });
                    setIsLoading(false);
                }, (geoError) => {
                    setError(t('explore.geolocationError', { message: geoError.message }));
                    setIsLoading(false);
                });
                return; // Exit here because geolocation is async
            }
        } catch (err) {
            console.error(err);
            setError(t('explore.genericError', { message: err instanceof Error ? err.message : '' }));
        }
        setIsLoading(false);
    };
    
    const handleProgressImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const analysisPrompt = t('explore.progressAnalysisPrompt');
                const analysisResult = await analyzeImage(base64String, file.type, analysisPrompt);
                setResult({ text: analysisResult });
            };
            reader.readAsDataURL(file);
        } catch (e) {
            console.error(e);
            setError(t('explore.progressAnalysisError'));
        } finally {
            setIsLoading(false);
        }
    }


    const getFeatureConfig = () => {
        switch (activeFeature) {
            case 'search': return { title: t('explore.searchTitle'), icon: DocumentSearchIcon, placeholder: t('explore.searchPlaceholder') };
            case 'maps': return { title: t('explore.mapsTitle'), icon: LocationMarkerIcon, placeholder: t('explore.mapsPlaceholder') };
            case 'imageGen': return { title: t('explore.imageGenTitle'), icon: PhotographIcon, placeholder: t('explore.imageGenPlaceholder') };
            case 'progress': return { title: t('explore.progressTitle'), icon: UploadIcon, placeholder: '' };
            default: return { title: '', icon: () => null, placeholder: '' };
        }
    };

    const { title, icon: Icon, placeholder } = getFeatureConfig();

    return (
        <div className="p-4 space-y-6">
            <header>
                <h1 className="text-3xl font-bold">{t('explore.mainTitle')}</h1>
                <p className="text-on-surface-secondary">{t('explore.mainSubtitle')}</p>
            </header>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-surface p-1 rounded-lg">
                <button onClick={() => setActiveFeature('search')} className={`w-full p-2 rounded text-sm ${activeFeature === 'search' ? 'bg-primary' : 'hover:bg-gray-600'}`}>{t('explore.searchTab')}</button>
                <button onClick={() => setActiveFeature('maps')} className={`w-full p-2 rounded text-sm ${activeFeature === 'maps' ? 'bg-primary' : 'hover:bg-gray-600'}`}>{t('explore.mapsTab')}</button>
                <button onClick={() => setActiveFeature('imageGen')} className={`w-full p-2 rounded text-sm ${activeFeature === 'imageGen' ? 'bg-primary' : 'hover:bg-gray-600'}`}>{t('explore.imagesTab')}</button>
                <button onClick={() => setActiveFeature('progress')} className={`w-full p-2 rounded text-sm ${activeFeature === 'progress' ? 'bg-primary' : 'hover:bg-gray-600'}`}>{t('explore.progressTab')}</button>
            </div>

            <div className="bg-surface p-4 rounded-lg shadow-lg min-h-[300px]">
                <div className="flex items-center space-x-3 mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>

                {activeFeature === 'progress' ? (
                     <div>
                        <p className="text-on-surface-secondary mb-4 text-sm">{t('explore.progressDescription')}</p>
                        <label className="w-full cursor-pointer flex items-center justify-center bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-gray-500">
                             <UploadIcon className="w-5 h-5 mr-2" />
                             {t('explore.progressButton')}
                             <input type="file" className="hidden" accept="image/*" onChange={handleProgressImageUpload} disabled={isLoading}/>
                        </label>
                     </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex items-center">
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={placeholder}
                            className="flex-grow bg-background border border-gray-600 rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button type="submit" disabled={isLoading} className="bg-primary text-white p-2 rounded-r-lg hover:bg-primary-focus disabled:bg-gray-500">
                            {isLoading ? <LoadingSpinner size={6} /> : <SearchIcon className="w-6 h-6"/>}
                        </button>
                    </form>
                )}

                {isLoading && <div className="mt-4 flex justify-center"><LoadingSpinner /></div>}
                {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
                {result && (
                    <div className="mt-4 p-4 bg-background rounded-md">
                        {result.imageUrl && <img src={result.imageUrl} alt="Generated" className="rounded-lg mb-4 max-w-full mx-auto" />}
                        <div className="prose prose-invert max-w-none text-on-surface text-sm" dangerouslySetInnerHTML={{ __html: result.text.replace(/\n/g, '<br />') }} />
                        {result.sources && result.sources.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-bold text-sm text-on-surface-secondary">{t('explore.sources')}</h4>
                                <ul className="list-disc list-inside text-xs">
                                    {result.sources.map((source, index) => (
                                        <li key={index}>
                                            <a href={source.web?.uri || source.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                {source.web?.title || source.maps?.title}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
