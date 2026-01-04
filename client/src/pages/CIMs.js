import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Search,
  Description,
  Edit,
  Delete,
  GetApp,
  AutoAwesome,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const CIMs = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const selectedCompany = location.state?.selectedCompany;

  const { data: cimsData, isLoading } = useQuery(
    ['cims', searchTerm, statusFilter],
    async () => {
      const response = await axios.get('/api/cims', {
        params: { 
          search: searchTerm,
          status: statusFilter || undefined
        }
      });
      return response.data;
    }
  );

  const { data: companies } = useQuery('companies', async () => {
    const response = await axios.get('/api/companies');
    return response.data.companies;
  });

  const createCIMMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/cims', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('cims');
        toast.success('CIM created successfully');
        navigate(`/cims/${data.id}`);
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create CIM');
      },
    }
  );

  const deleteCIMMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/cims/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cims');
        toast.success('CIM deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete CIM');
      },
    }
  );

  const handleOpen = () => {
    if (selectedCompany) {
      reset({ companyId: selectedCompany.id });
    } else {
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    await createCIMMutation.mutateAsync({
      ...data,
      templateId: 'standard-cim'
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this CIM?')) {
      await deleteCIMMutation.mutateAsync(id);
    }
  };

  const handleExport = async (cim) => {
    try {
      const response = await axios.get(`/api/cims/${cim.id}/export`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${cim.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('CIM exported successfully');
    } catch (error) {
      toast.error('Failed to export CIM');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      IN_REVIEW: 'warning',
      APPROVED: 'success',
      PUBLISHED: 'primary',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">CIMs</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpen}
        >
          Create CIM
        </Button>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search CIMs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="IN_REVIEW">In Review</MenuItem>
            <MenuItem value="APPROVED">Approved</MenuItem>
            <MenuItem value="PUBLISHED">Published</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {cimsData?.cims?.map((cim) => (
          <Grid item xs={12} sm={6} md={4} key={cim.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Description color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div" noWrap>
                    {cim.title}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  {cim.company?.name}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {cim.company?.industry}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Chip
                    label={cim.status}
                    color={getStatusColor(cim.status)}
                    size="small"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {format(new Date(cim.updatedAt), 'MMM dd, yyyy')}
                  </Typography>
                </Box>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/cims/${cim.id}`)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleExport(cim)}
                      color="primary"
                    >
                      <GetApp />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(cim.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  {cim.aiAnalysis && (
                    <Chip
                      icon={<AutoAwesome />}
                      label="AI Generated"
                      size="small"
                      color="secondary"
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {cimsData?.cims?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Description sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No CIMs found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {searchTerm || statusFilter 
              ? 'Try adjusting your search or filter criteria' 
              : 'Get started by creating your first CIM'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpen}
          >
            Create CIM
          </Button>
        </Box>
      )}

      {/* Create CIM Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New CIM</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              fullWidth
              label="CIM Title"
              margin="normal"
              {...register('title', { required: 'CIM title is required' })}
              error={!!errors.title}
              helperText={errors.title?.message}
            />
            <TextField
              fullWidth
              select
              label="Company"
              margin="normal"
              defaultValue={selectedCompany?.id || ''}
              {...register('companyId', { required: 'Company is required' })}
              error={!!errors.companyId}
              helperText={errors.companyId?.message}
            >
              {companies?.map((company) => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name} - {company.industry}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createCIMMutation.isLoading}
            >
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CIMs;