import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  Business,
  Description,
  Analytics,
  AutoAwesome,
  AttachMoney,
  Speed,
  CheckCircle,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats } = useQuery('dashboard-stats', async () => {
    const response = await axios.get('/api/dashboard/stats');
    return response.data;
  });

  const { data: recentCIMs } = useQuery('recent-cims', async () => {
    const response = await axios.get('/api/cims?limit=3');
    return response.data.cims;
  });

  const { data: companies } = useQuery('companies', async () => {
    const response = await axios.get('/api/companies?limit=10');
    return response.data.companies;
  });

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      IN_REVIEW: 'warning',
      APPROVED: 'success',
      PUBLISHED: 'primary',
    };
    return colors[status] || 'default';
  };

  const InsightCard = ({ title, value, subtitle, icon, color = 'primary', trend }) => (
    <Card
      sx={{
        height: '100%',
        bgcolor: `${color}.main`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: (theme) => `linear-gradient(135deg, ${theme.palette[color]?.light || theme.palette.primary.light}, ${theme.palette[color]?.main || theme.palette.primary.main})`,
          zIndex: 0
        }
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
            {icon}
          </Avatar>
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold" mb={1} sx={{ color: 'white' }}>
          {value || '0'}
        </Typography>
        <Typography variant="h6" mb={1} sx={{ color: 'white' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, color: 'white' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          CIM Intelligence Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary">
          AI-powered insights for investment banking automation
        </Typography>
      </Box>

      {/* Key Insights */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <InsightCard
            title="Time Saved"
            value={stats?.timeSaved || '0%'}
            subtitle="Average reduction in CIM creation time"
            icon={<Speed />}
            color="success"
            trend="+15% this month"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InsightCard
            title="AI Accuracy"
            value={stats?.aiAccuracy || '94%'}
            subtitle="AI analysis accuracy rate"
            icon={<AutoAwesome />}
            color="secondary"
            trend="+8% improvement"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InsightCard
            title="ROI Generated"
            value={stats?.roiValue || '$0'}
            subtitle="Total investment value analyzed"
            icon={<AttachMoney />}
            color="warning"
            trend="18.5% avg IRR"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InsightCard
            title="Companies"
            value={stats?.totalCompanies || companies?.length || 0}
            subtitle="Active company profiles"
            icon={<Business />}
            color="info"
            trend="Ready for analysis"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Company Portfolio */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Company Portfolio
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/companies')}
                >
                  View All
                </Button>
              </Box>

              <Grid container spacing={2}>
                {companies?.slice(0, 6).map((company) => (
                  <Grid item xs={12} sm={6} key={company.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => navigate('/companies')}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 32, height: 32 }}>
                          <Business fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {company.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {company.industry}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="textSecondary" noWrap>
                        {company.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Recent CIMs
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/cims')}
                >
                  View All
                </Button>
              </Box>

              {recentCIMs?.length > 0 ? (
                <List>
                  {recentCIMs.map((cim) => (
                    <ListItem
                      key={cim.id}
                      button
                      onClick={() => navigate(`/cims/${cim.id}`)}
                      sx={{ px: 0 }}
                    >
                      <ListItemIcon>
                        <Description color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={cim.title}
                        secondary={cim.company?.name}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <Chip
                        label={cim.status}
                        color={getStatusColor(cim.status)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box textAlign="center" py={4}>
                  <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography color="textSecondary" variant="body2" mb={2}>
                    No CIMs created yet
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => navigate('/cims')}
                  >
                    Create First CIM
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<AutoAwesome />}
                    onClick={() => navigate('/cims')}
                    sx={{ py: 2 }}
                  >
                    Generate CIM with AI
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<Business />}
                    onClick={() => navigate('/companies')}
                    sx={{ py: 2 }}
                  >
                    Manage Companies
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<Analytics />}
                    onClick={() => navigate('/analytics')}
                    sx={{ py: 2 }}
                  >
                    View Analytics
                  </Button>
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;