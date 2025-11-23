import React, { useState, useRef } from 'react';
import { Camera, Upload, X, ArrowRight, Car, FileText, AlertTriangle, Sparkles, ScanEye, Plus } from 'lucide-react';
import { AccidentInput } from '../types';
import { identifyVehicleFromImage } from '../services/geminiService';

interface InputFormProps {
  onSubmit: (data: AccidentInput) => void;
  isAnalyzing: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isAnalyzing }) => {
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isIdentifying, setIsIdentifying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
      
      // Generate previews
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    // Revoke old URL to avoid memory leaks (though browsers handle this eventually)
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAutoDetect = async () => {
    if (images.length === 0) return;
    setIsIdentifying(true);
    try {
      const result = await identifyVehicleFromImage(images);
      setYear(result.year);
      setMake(result.make);
      setModel(result.model);
      setDescription(result.description);
    } catch (error) {
      console.error("Failed to identify vehicle", error);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      vehicle: { year, make, model },
      description,
      context,
      images: images,
    });
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Image Upload Section */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm relative overflow-hidden">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <Camera className="w-5 h-5" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Visual Evidence (Start Here)</h2>
              </div>
              {images.length > 0 && !isIdentifying && (
                <button 
                  type="button"
                  onClick={handleAutoDetect}
                  className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-all animate-in fade-in slide-in-from-right-4"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-Fill Details
                </button>
              )}
           </div>

           {/* Image Grid */}
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-700 group">
                  <img 
                    src={preview} 
                    alt={`Evidence ${index + 1}`} 
                    className={`w-full h-full object-cover ${isIdentifying ? 'opacity-50 blur-[2px] transition-all' : ''}`} 
                  />
                   {/* Remove Button */}
                   {!isIdentifying && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-500/90 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                   )}
                </div>
              ))}
              
              {/* Add Button */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all group ${images.length === 0 ? 'col-span-2 sm:col-span-3 h-48 sm:h-auto' : ''}`}
              >
                <div className={`bg-slate-800 p-3 rounded-full mb-2 group-hover:bg-blue-600 transition-colors ${images.length === 0 ? 'scale-110' : ''}`}>
                  {images.length === 0 ? <Upload className="w-6 h-6 text-slate-400 group-hover:text-white" /> : <Plus className="w-5 h-5 text-slate-400 group-hover:text-white" />}
                </div>
                {images.length === 0 && (
                  <>
                     <p className="text-sm text-slate-300 font-medium text-center px-4">Click to upload photos</p>
                     <p className="text-xs text-slate-500 mt-1">Supports Multiple JPG, PNG</p>
                  </>
                )}
                {images.length > 0 && <span className="text-xs text-slate-400 font-medium">Add Photo</span>}
              </div>
           </div>
           
           {/* Scan Overlay */}
           {isIdentifying && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                 <ScanEye className="w-12 h-12 text-blue-500 animate-pulse mb-2 drop-shadow-lg" />
                 <p className="text-white font-medium text-sm drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Processing Evidence...</p>
              </div>
           )}

          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Vehicle Details Section */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm transition-all duration-300">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <Car className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Vehicle Identification</h2>
          </div>
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
              <input
                type="text"
                required
                placeholder="2022"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="col-span-4 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Make</label>
              <input
                type="text"
                required
                placeholder="Toyota"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Model</label>
              <input
                type="text"
                required
                placeholder="Camry"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Accident Description Section */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-4 text-blue-400">
            <FileText className="w-5 h-5" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">Incident Details</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Description of Damage / Accident</label>
              <textarea
                required
                rows={4}
                placeholder="e.g. Vehicle was struck from the rear at approx 20 MPH. Bumper is crushed, trunk alignment looks off..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Additional Context (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Icy road conditions, low visibility, third-party report..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isAnalyzing || isIdentifying}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all ${
            (isAnalyzing || isIdentifying)
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white transform hover:translate-y-[-1px]'
          }`}
        >
          {isAnalyzing ? (
            <>
              <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
              <span>Running Analysis Protocol...</span>
            </>
          ) : (
            <>
              <span>Generate Damage Report</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="flex items-start gap-2 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-500/80 leading-relaxed">
            <strong>Disclaimer:</strong> This tool uses AI for preliminary estimation only. It does not replace a physical inspection by a licensed professional. Always verify critical safety components manually.
          </p>
        </div>
      </form>
    </div>
  );
};