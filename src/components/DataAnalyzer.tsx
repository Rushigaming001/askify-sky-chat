import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { Upload, FileSpreadsheet, Loader2, BarChart3, X } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export const DataAnalyzer = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload CSV, Excel, or text files only',
        variant: 'destructive'
      });
      return;
    }

    // Check file size (max 5MB)
    if (uploadedFile.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 5MB',
        variant: 'destructive'
      });
      return;
    }

    setFile(uploadedFile);

    // Read file content
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      toast({
        title: 'File uploaded',
        description: `${uploadedFile.name} loaded successfully`
      });
    };
    reader.readAsText(uploadedFile);
  };

  const analyzeData = async () => {
    if (!fileContent && !question) {
      toast({
        title: 'Missing input',
        description: 'Please upload a file or ask a question',
        variant: 'destructive'
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // Prepare the analysis prompt
      let prompt = 'You are a data analyst AI. ';
      
      if (fileContent) {
        // Limit data preview to first 2000 characters
        const dataPreview = fileContent.slice(0, 2000);
        prompt += `Analyze this dataset:\n\n${dataPreview}\n\n`;
        
        if (fileContent.length > 2000) {
          prompt += `(Dataset preview - total size: ${Math.round(fileContent.length / 1024)}KB)\n\n`;
        }
      }

      if (question) {
        prompt += `User question: ${question}\n\n`;
      }

      prompt += `Provide a comprehensive analysis including:
1. A clear summary of the data
2. Key insights and patterns
3. Actionable recommendations

Format your response as JSON with keys: summary, insights (array), recommendations (array)`;

      // Call AI through edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: 'user', content: prompt }
          ],
          model: 'gemini',
          mode: 'normal'
        }
      });

      if (error) throw error;

      // Parse AI response
      try {
        // Try to extract JSON from the response
        const reply = data.reply;
        const jsonMatch = reply.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setAnalysis(parsed);
        } else {
          // Fallback: create structured response from text
          setAnalysis({
            summary: reply.split('\n')[0] || 'Analysis completed',
            insights: reply.split('\n').filter((line: string) => line.includes('•') || line.includes('-')).slice(0, 5),
            recommendations: ['Review the detailed analysis above', 'Consider the patterns identified', 'Apply insights to your workflow']
          });
        }

        toast({
          title: 'Analysis complete',
          description: 'Your data has been analyzed'
        });
      } catch (parseError) {
        console.error('Parse error:', parseError);
        setAnalysis({
          summary: data.reply || 'Analysis completed',
          insights: ['Analysis generated successfully'],
          recommendations: ['Review the summary above']
        });
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Failed to analyze data',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFileContent('');
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Data Analyzer
        </h1>
        <p className="text-muted-foreground">
          Upload your data files and get AI-powered insights and analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Data</CardTitle>
            <CardDescription>
              Upload CSV, Excel, or text files (max 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            {!file ? (
              <Button
                variant="outline"
                className="w-full h-32 border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span>Click to upload file</span>
                  <span className="text-xs text-muted-foreground">
                    CSV, Excel, or text files
                  </span>
                </div>
              </Button>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ask a question about your data (optional)
              </label>
              <Textarea
                placeholder="e.g., What are the main trends in this data? What insights can you find?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              className="w-full"
              onClick={analyzeData}
              disabled={isAnalyzing || (!file && !question)}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analyze Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-generated insights from your data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {!analysis ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Upload a file and click "Analyze Data" to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p className="text-sm text-muted-foreground">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Insights */}
                  {analysis.insights && analysis.insights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Key Insights</h3>
                      <ul className="space-y-2">
                        {analysis.insights.map((insight, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary font-bold">•</span>
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-green-600 font-bold">✓</span>
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};