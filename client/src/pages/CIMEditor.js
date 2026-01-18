import React, { useState, useRef } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  AutoAwesome,
  Save,
  GetApp,
  Preview,
  Analytics,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

const CIMEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeStep, setActiveStep] = useState(0);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [processingFiles, setProcessingFiles] = useState(false);
  const fileInputRef = useRef(null);

  const { register, handleSubmit, watch, setValue } = useForm();

  const { data: cim, isLoading } = useQuery(['cim', id], async () => {
    const response = await axios.get(`/api/cims/${id}`);
    return response.data;
  });

  const updateCIMMutation = useMutation(
    async (data) => {
      const response = await axios.put(`/api/cims/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['cim', id]);
        toast.success('CIM updated successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update CIM');
      },
    }
  );

  const generateAIMutation = useMutation(
    async (data) => {
      const response = await axios.post(`/api/cims/${id}/generate`, data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['cim', id]);
        toast.success('AI analysis completed successfully');
        setActiveStep(4); // Move to review step
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'AI generation failed');
      },
    }
  );

  const steps = [
    {
      label: 'Company Information',
      description: 'Basic company details and overview',
    },
    {
      label: 'Financial Data',
      description: 'Upload and input financial information',
    },
    {
      label: 'Market Analysis',
      description: 'Industry and market data',
    },
    {
      label: 'AI Generation',
      description: 'Generate CIM content using AI',
    },
    {
      label: 'Review & Finalize',
      description: 'Review and edit generated content',
    },
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleGenerateAI = async (formData) => {
    setGeneratingAI(true);
    try {
      // Transform the form data into the expected format
      const financialData = {
        revenue: [
          parseFloat(formData.financialData?.revenue2020) || 1200000,
          parseFloat(formData.financialData?.revenue2021) || 1500000,
          parseFloat(formData.financialData?.revenue2022) || 1800000,
          parseFloat(formData.financialData?.revenue2023) || 2500000,
          parseFloat(formData.financialData?.revenue2024) || 3200000
        ],
        expenses: [
          (parseFloat(formData.financialData?.revenue2020) || 1200000) - (parseFloat(formData.financialData?.ebitda2020) || 300000),
          (parseFloat(formData.financialData?.revenue2021) || 1500000) - (parseFloat(formData.financialData?.ebitda2021) || 375000),
          (parseFloat(formData.financialData?.revenue2022) || 1800000) - (parseFloat(formData.financialData?.ebitda2022) || 450000),
          (parseFloat(formData.financialData?.revenue2023) || 2500000) - (parseFloat(formData.financialData?.ebitda2023) || 625000),
          (parseFloat(formData.financialData?.revenue2024) || 3200000) - (parseFloat(formData.financialData?.ebitda2024) || 800000)
        ],
        netIncome: [
          parseFloat(formData.financialData?.netIncome2020) || 180000,
          parseFloat(formData.financialData?.netIncome2021) || 225000,
          parseFloat(formData.financialData?.netIncome2022) || 270000,
          parseFloat(formData.financialData?.netIncome2023) || 375000,
          parseFloat(formData.financialData?.netIncome2024) || 480000
        ],
        cashFlow: [
          parseFloat(formData.financialData?.cashFlow2020) || 240000,
          parseFloat(formData.financialData?.cashFlow2021) || 300000,
          parseFloat(formData.financialData?.cashFlow2022) || 360000,
          parseFloat(formData.financialData?.cashFlow2023) || 500000,
          parseFloat(formData.financialData?.cashFlow2024) || 640000
        ],
        years: [2020, 2021, 2022, 2023, 2024]
      };

      const industryData = {
        marketSize: parseFloat(formData.industryData?.marketSize) || 50000000000,
        growthRate: parseFloat(formData.industryData?.growthRate) || 15,
        competitors: formData.industryData?.competitors?.split(',').map(c => c.trim()) || ['PayPal', 'Square', 'Stripe'],
        trends: formData.industryData?.trends?.split(',').map(t => t.trim()) || ['Digital transformation', 'Mobile payments', 'AI integration']
      };

      const assumptions = {
        investmentAmount: 5000000,
        exitMultiple: 5,
        timeHorizon: 5
      };

      await generateAIMutation.mutateAsync({
        financialData,
        industryData,
        assumptions,
      });
    } catch (error) {
      console.error('AI Generation Error:', error);
      toast.error('AI generation failed. Please check your data and try again.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = async (formData) => {
    // If called from the "Save & Finalize" button, formData might be an event object or undefined if we are just saving context
    // We should ensure we have the form data. Wrapper function might be needed or we read from watch()
    const currentData = watch(); // Get all form data

    // Merge specific step data if passed directly (though react-hook-form handles this mostly)

    await updateCIMMutation.mutateAsync({
      content: currentData, // saving the whole state essentially, or specific parts
      status: 'APPROVED' // Assuming finalize means approve/ready
    });
    navigate('/dashboard');
  };

  // Wrapper for the 'Save' button which might just save draft
  const handleSaveDraft = async () => {
    const currentData = watch();
    await updateCIMMutation.mutateAsync({
      content: currentData
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axios.get(`/api/cims/${id}/export`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cim.title || 'CIM'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('CIM exported successfully');
    } catch (error) {
      toast.error('Failed to export CIM');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    setOpenPreview(true);
  };

  const handleClosePreview = () => {
    setOpenPreview(false);
  };

  const handleViewAnalytics = () => {
    navigate('/analytics', { state: { cim } });
  };

  // File upload handlers
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
    toast.success(`${files.length} file(s) selected`);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const validFiles = files.filter(file => {
      const validTypes = ['.xlsx', '.xls', '.pdf', '.csv'];
      return validTypes.some(type => file.name.toLowerCase().endsWith(type));
    });

    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Only Excel, PDF, and CSV files are supported.');
    }

    setUploadedFiles(prev => [...prev, ...validFiles]);
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) uploaded`);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast.success('File removed');
  };

  const processUploadedFiles = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('No files to process');
      return;
    }

    setProcessingFiles(true);
    try {
      const formData = new FormData();
      uploadedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await axios.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Auto-populate form fields with extracted data
        const extractedData = response.data.data;

        if (extractedData.revenue) {
          setValue('financialData.revenue2020', extractedData.revenue[0]);
          setValue('financialData.revenue2021', extractedData.revenue[1]);
          setValue('financialData.revenue2022', extractedData.revenue[2]);
          setValue('financialData.revenue2023', extractedData.revenue[3]);
          setValue('financialData.revenue2024', extractedData.revenue[4]);
        }

        if (extractedData.netIncome) {
          setValue('financialData.netIncome2020', extractedData.netIncome[0]);
          setValue('financialData.netIncome2021', extractedData.netIncome[1]);
          setValue('financialData.netIncome2022', extractedData.netIncome[2]);
          setValue('financialData.netIncome2023', extractedData.netIncome[3]);
          setValue('financialData.netIncome2024', extractedData.netIncome[4]);
        }

        if (extractedData.cashFlow) {
          setValue('financialData.cashFlow2020', extractedData.cashFlow[0]);
          setValue('financialData.cashFlow2021', extractedData.cashFlow[1]);
          setValue('financialData.cashFlow2022', extractedData.cashFlow[2]);
          setValue('financialData.cashFlow2023', extractedData.cashFlow[3]);
          setValue('financialData.cashFlow2024', extractedData.cashFlow[4]);
        }

        if (extractedData.ebitda) {
          setValue('financialData.ebitda2020', extractedData.ebitda[0]);
          setValue('financialData.ebitda2021', extractedData.ebitda[1]);
          setValue('financialData.ebitda2022', extractedData.ebitda[2]);
          setValue('financialData.ebitda2023', extractedData.ebitda[3]);
          setValue('financialData.ebitda2024', extractedData.ebitda[4]);
        }

        // Auto-populate market analysis fields if available
        if (extractedData.marketData) {
          if (extractedData.marketData.marketSize) {
            setValue('industryData.marketSize', extractedData.marketData.marketSize);
          }
          if (extractedData.marketData.growthRate) {
            setValue('industryData.growthRate', extractedData.marketData.growthRate);
          }
          if (extractedData.marketData.competitors) {
            setValue('industryData.competitors', extractedData.marketData.competitors.join(', '));
          }
          if (extractedData.marketData.trends) {
            setValue('industryData.trends', extractedData.marketData.trends.join(', '));
          }
        }

        toast.success('Files processed successfully! Financial data and market information extracted.');
      }
    } catch (error) {
      console.error('File processing error:', error);
      toast.error('Failed to process files. Please try again or enter data manually.');
    } finally {
      setProcessingFiles(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" gutterBottom>
            {cim?.title}
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={cim?.status}
              color={cim?.status === 'APPROVED' ? 'success' : 'default'}
            />
            <Typography variant="body2" color="textSecondary">
              {cim?.company?.name} • {cim?.company?.industry}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Preview />}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit(handleSaveDraft)}
          >
            Save
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      onClick={() => setActiveStep(index)}
                      sx={{ cursor: 'pointer' }}
                    >
                      {step.label}
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="textSecondary">
                        {step.description}
                      </Typography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Company Name"
                        defaultValue={cim?.company?.name}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Industry"
                        defaultValue={cim?.company?.industry}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Founded"
                        {...register('founded')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Company Description"
                        defaultValue={cim?.company?.description}
                        {...register('description')}
                      />
                    </Grid>
                  </Grid>
                  <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Financial Data
                  </Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Upload financial statements (Excel/PDF) or input key financial metrics manually.
                  </Alert>

                  {/* File Upload Section */}
                  <Card sx={{ mb: 3, p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      📁 Upload Financial Documents
                    </Typography>
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onDrop={handleFileDrop}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        type="file"
                        accept=".xlsx,.xls,.pdf,.csv"
                        style={{ display: 'none' }}
                        id="financial-upload"
                        multiple
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                      />
                      <label htmlFor="financial-upload" style={{ cursor: 'pointer' }}>
                        <Typography variant="body1" gutterBottom>
                          📊 Drop financial statements here or click to browse
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Supported: Excel (.xlsx, .xls), PDF, CSV files
                        </Typography>
                        <Button variant="outlined" sx={{ mt: 2 }} onClick={() => fileInputRef.current?.click()}>
                          Choose Files
                        </Button>
                      </label>
                    </Box>

                    {/* Display uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Uploaded Files:
                        </Typography>
                        {uploadedFiles.map((file, index) => (
                          <Chip
                            key={index}
                            label={`${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                            onDelete={() => removeFile(index)}
                            sx={{ mr: 1, mb: 1 }}
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                        <Button
                          variant="contained"
                          size="small"
                          onClick={processUploadedFiles}
                          sx={{ ml: 2 }}
                          disabled={processingFiles}
                        >
                          {processingFiles ? <CircularProgress size={20} /> : 'Process Files'}
                        </Button>
                      </Box>
                    )}

                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                      AI will automatically extract financial data from uploaded documents
                    </Typography>
                  </Card>

                  <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                    Or Enter Data Manually
                  </Typography>

                  {/* Year Headers */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">Metric</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">2020</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">2021</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">2022</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">2023</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <Typography variant="subtitle2" fontWeight="bold">2024</Typography>
                    </Grid>
                  </Grid>

                  {/* Revenue Row */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ pt: 1 }}>Revenue ($)</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.revenue2020')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.revenue2021')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.revenue2022')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.revenue2023')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.revenue2024')} />
                    </Grid>
                  </Grid>

                  {/* EBITDA Row */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ pt: 1 }}>EBITDA ($)</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.ebitda2020')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.ebitda2021')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.ebitda2022')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.ebitda2023')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.ebitda2024')} />
                    </Grid>
                  </Grid>

                  {/* Net Income Row */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ pt: 1 }}>Net Inc ($)</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.netIncome2020')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.netIncome2021')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.netIncome2022')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.netIncome2023')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.netIncome2024')} />
                    </Grid>
                  </Grid>

                  {/* Cash Flow Row */}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={2}>
                      <Typography variant="body2" sx={{ pt: 1 }}>C. Flow ($)</Typography>
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.cashFlow2020')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.cashFlow2021')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.cashFlow2022')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.cashFlow2023')} />
                    </Grid>
                    <Grid item xs={2}>
                      <TextField fullWidth size="small" type="number" {...register('financialData.cashFlow2024')} />
                    </Grid>
                  </Grid>

                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button onClick={handleBack}>Back</Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Market Analysis
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Market Size ($M)"
                        type="number"
                        {...register('industryData.marketSize')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Growth Rate (%)"
                        type="number"
                        {...register('industryData.growthRate')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Key Competitors"
                        {...register('industryData.competitors')}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Market Trends"
                        {...register('industryData.trends')}
                      />
                    </Grid>
                  </Grid>
                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button onClick={handleBack}>Back</Button>
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 3 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    AI Generation
                  </Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Our AI will analyze your data and generate comprehensive CIM content including financial analysis, market insights, and ROI projections.
                  </Alert>

                  {generatingAI ? (
                    <Box textAlign="center" py={4}>
                      <CircularProgress size={60} />
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Generating AI Analysis...
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        This may take a few minutes
                      </Typography>
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AutoAwesome />}
                        onClick={handleSubmit(handleGenerateAI)}
                        sx={{ mb: 2 }}
                      >
                        Generate CIM with AI
                      </Button>
                      <Typography variant="body2" color="textSecondary">
                        Click to start AI-powered CIM generation
                      </Typography>
                    </Box>
                  )}

                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button onClick={handleBack}>Back</Button>
                  </Box>
                </Box>
              )}

              {activeStep === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Review & Finalize
                  </Typography>

                  {cim?.content && (
                    <Box>
                      <Alert severity="success" sx={{ mb: 3 }}>
                        AI analysis completed! Review the generated content below.
                      </Alert>

                      {/* Executive Summary */}
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          Executive Summary
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={6}
                          defaultValue={cim.content.sections?.executiveSummary?.content}
                          {...register('content.executiveSummary')}
                        />
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      {/* Financial Highlights */}
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          Financial Analysis
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          defaultValue={JSON.stringify(cim.content.sections?.financialAnalysis?.content, null, 2)}
                          {...register('content.financialAnalysis')}
                        />
                      </Box>

                      <Divider sx={{ my: 3 }} />

                      {/* Market Analysis */}
                      <Box mb={3}>
                        <Typography variant="h6" gutterBottom>
                          Market Analysis
                        </Typography>
                        <TextField
                          fullWidth
                          multiline
                          rows={4}
                          defaultValue={JSON.stringify(cim.content.sections?.marketAnalysis?.content, null, 2)}
                          {...register('content.marketAnalysis')}
                        />
                      </Box>
                    </Box>
                  )}

                  <Box mt={3} display="flex" justifyContent="space-between">
                    <Button onClick={handleBack}>Back</Button>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Analytics />}
                        onClick={handleViewAnalytics}
                      >
                        View Analytics
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleSubmit(handleSave)}
                      >
                        Save & Finalize
                      </Button>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={openPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle display="flex" justifyContent="space-between" alignItems="center">
          Preview CIM
          <Button onClick={handleClosePreview} startIcon={<CloseIcon />}>
            Close
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Box mb={3}>
            <Typography variant="h5" gutterBottom>{cim?.title}</Typography>
            <Typography variant="subtitle1" color="textSecondary">{cim?.company?.name}</Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Executive Summary</Typography>
            <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
              {watch('content.executiveSummary') || cim?.content?.sections?.executiveSummary?.content || 'No content generated yet.'}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Financial Analysis</Typography>
            <Typography variant="body1" component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {watch('content.financialAnalysis') || JSON.stringify(cim?.content?.sections?.financialAnalysis?.content, null, 2) || 'No financial analysis.'}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>Market Analysis</Typography>
            <Typography variant="body1" component="pre" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
              {watch('content.marketAnalysis') || JSON.stringify(cim?.content?.sections?.marketAnalysis?.content, null, 2) || 'No market analysis.'}
            </Typography>
          </Box>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button variant="contained" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CIMEditor;