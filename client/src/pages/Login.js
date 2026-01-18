import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const { register: registerField, handleSubmit, formState: { errors }, reset } = useForm();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
    reset();
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      let result;
      if (tabValue === 0) {
        // Login
        result = await login(data.email, data.password);
      } else {
        // Register
        result = await register(data);
      }

      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
        padding: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              CIM Platform
            </Typography>
            <Typography variant="body2" color="textSecondary">
              AI-Powered Investment Memorandum Automation
            </Typography>
          </Box>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {tabValue === 1 && (
              <>
                <Box display="flex" gap={2} mb={2}>
                  <TextField
                    fullWidth
                    label="First Name"
                    {...registerField('firstName', { required: 'First name is required' })}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    {...registerField('lastName', { required: 'Last name is required' })}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                  />
                </Box>
              </>
            )}

            <TextField
              fullWidth
              label="Email / User ID"
              sx={{ mb: 2 }}
              {...registerField('email', {
                required: 'User ID is required'
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              sx={{ mb: 3 }}
              {...registerField('password', {
                required: 'Password is required'
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                tabValue === 0 ? 'Login' : 'Register'
              )}
            </Button>
          </form>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2" color="textSecondary">
              {tabValue === 0 ? "Don't have an account? " : "Already have an account? "}
              <Button
                variant="text"
                onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
                sx={{ textTransform: 'none' }}
              >
                {tabValue === 0 ? 'Register here' : 'Login here'}
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;