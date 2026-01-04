import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  InputAdornment,
} from '@mui/material';
import {
  Add,
  Search,
  Business,
  Edit,
  Delete,
  Description,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Companies = () => {
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: companiesData, isLoading } = useQuery(
    ['companies', searchTerm],
    async () => {
      const response = await axios.get('/api/companies', {
        params: { search: searchTerm }
      });
      return response.data;
    }
  );

  const createCompanyMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/companies', data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company created successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create company');
      },
    }
  );

  const updateCompanyMutation = useMutation(
    async ({ id, data }) => {
      const response = await axios.put(`/api/companies/${id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company updated successfully');
        handleClose();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update company');
      },
    }
  );

  const deleteCompanyMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/companies/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('companies');
        toast.success('Company deleted successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete company');
      },
    }
  );

  const handleOpen = (company = null) => {
    setEditingCompany(company);
    if (company) {
      reset(company);
    } else {
      reset();
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCompany(null);
    reset();
  };

  const onSubmit = async (data) => {
    if (editingCompany) {
      await updateCompanyMutation.mutateAsync({ id: editingCompany.id, data });
    } else {
      await createCompanyMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      await deleteCompanyMutation.mutateAsync(id);
    }
  };

  const handleCreateCIM = (company) => {
    navigate('/cims', { state: { selectedCompany: company } });
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4">Companies</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Add Company
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search companies..."
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
      </Box>

      <Grid container spacing={3}>
        {companiesData?.companies?.map((company) => (
          <Grid item xs={12} sm={6} md={4} key={company.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Business color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    {company.name}
                  </Typography>
                </Box>
                
                <Chip
                  label={company.industry}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {company.description || 'No description available'}
                </Typography>
                
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  CIMs: {company._count?.cims || 0}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(company)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(company.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => handleCreateCIM(company)}
                  >
                    Create CIM
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {companiesData?.companies?.length === 0 && (
        <Box textAlign="center" py={8}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No companies found
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first company'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpen()}
          >
            Add Company
          </Button>
        </Box>
      )}

      {/* Add/Edit Company Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCompany ? 'Edit Company' : 'Add New Company'}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              fullWidth
              label="Company Name"
              margin="normal"
              {...register('name', { required: 'Company name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Industry"
              margin="normal"
              {...register('industry', { required: 'Industry is required' })}
              error={!!errors.industry}
              helperText={errors.industry?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={4}
              {...register('description')}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createCompanyMutation.isLoading || updateCompanyMutation.isLoading}
            >
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Companies;