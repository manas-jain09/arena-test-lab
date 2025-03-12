
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Save, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();
  
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'ArenaHQ',
    adminEmail: 'admin@arenahq.com',
  });

  const [quizSettings, setQuizSettings] = useState({
    defaultDuration: 60,
    allowImageUpload: true,
    showResultsImmediately: false,
    enableCheatingDetection: true,
    autoGenerateReports: false,
  });

  const [emailSettings, setEmailSettings] = useState({
    sendEmailNotifications: true,
    emailHost: 'smtp.example.com',
    emailPort: '587',
    emailUser: 'notifications@arenahq.com',
    emailPassword: '********',
  });

  const handleGeneralSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGeneralSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleQuizSettingsChange = (name: string, value: boolean | number) => {
    setQuizSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, settings: string, checked: boolean) => {
    if (settings === 'quiz') {
      setQuizSettings(prev => ({ ...prev, [name]: checked }));
    } else if (settings === 'email') {
      setEmailSettings(prev => ({ ...prev, [name]: checked }));
    }
  };

  const handleSaveSettings = () => {
    // In a real app, this would save the settings to the backend
    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully',
    });
  };

  const handleTestEmailConnection = () => {
    // In a real app, this would test the email connection
    toast({
      title: 'Test email sent',
      description: 'A test email has been sent successfully',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Button 
          className="bg-arena-red hover:bg-arena-darkRed"
          onClick={handleSaveSettings}
        >
          <Save className="h-4 w-4 mr-2" /> Save Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>
              Manage basic platform settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                name="platformName"
                value={generalSettings.platformName}
                onChange={handleGeneralSettingsChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                value={generalSettings.adminEmail}
                onChange={handleGeneralSettingsChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Quiz Settings</CardTitle>
            <CardDescription>
              Configure default quiz behaviors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
              <Input
                id="defaultDuration"
                name="defaultDuration"
                type="number"
                min={5}
                value={quizSettings.defaultDuration}
                onChange={(e) => handleQuizSettingsChange('defaultDuration', Number(e.target.value))}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowImageUpload">Allow Image Upload</Label>
                  <p className="text-sm text-gray-500">
                    Allow images to be uploaded for questions
                  </p>
                </div>
                <Switch
                  id="allowImageUpload"
                  checked={quizSettings.allowImageUpload}
                  onCheckedChange={(checked) => handleSwitchChange('allowImageUpload', 'quiz', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showResultsImmediately">Show Results Immediately</Label>
                  <p className="text-sm text-gray-500">
                    Show results to students immediately after quiz completion
                  </p>
                </div>
                <Switch
                  id="showResultsImmediately"
                  checked={quizSettings.showResultsImmediately}
                  onCheckedChange={(checked) => handleSwitchChange('showResultsImmediately', 'quiz', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableCheatingDetection">Enable Cheating Detection</Label>
                  <p className="text-sm text-gray-500">
                    Flag suspicious student behavior during quizzes
                  </p>
                </div>
                <Switch
                  id="enableCheatingDetection"
                  checked={quizSettings.enableCheatingDetection}
                  onCheckedChange={(checked) => handleSwitchChange('enableCheatingDetection', 'quiz', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoGenerateReports">Auto Generate Reports</Label>
                  <p className="text-sm text-gray-500">
                    Automatically generate reports after quiz completion
                  </p>
                </div>
                <Switch
                  id="autoGenerateReports"
                  checked={quizSettings.autoGenerateReports}
                  onCheckedChange={(checked) => handleSwitchChange('autoGenerateReports', 'quiz', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Email Settings</CardTitle>
            <CardDescription>
              Configure email notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sendEmailNotifications">Send Email Notifications</Label>
                <p className="text-sm text-gray-500">
                  Enable or disable all email notifications
                </p>
              </div>
              <Switch
                id="sendEmailNotifications"
                checked={emailSettings.sendEmailNotifications}
                onCheckedChange={(checked) => handleSwitchChange('sendEmailNotifications', 'email', checked)}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emailHost">SMTP Host</Label>
                  <Input
                    id="emailHost"
                    name="emailHost"
                    value={emailSettings.emailHost}
                    onChange={handleEmailSettingsChange}
                    disabled={!emailSettings.sendEmailNotifications}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPort">SMTP Port</Label>
                  <Input
                    id="emailPort"
                    name="emailPort"
                    value={emailSettings.emailPort}
                    onChange={handleEmailSettingsChange}
                    disabled={!emailSettings.sendEmailNotifications}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailUser">SMTP Username</Label>
                <Input
                  id="emailUser"
                  name="emailUser"
                  value={emailSettings.emailUser}
                  onChange={handleEmailSettingsChange}
                  disabled={!emailSettings.sendEmailNotifications}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emailPassword">SMTP Password</Label>
                <Input
                  id="emailPassword"
                  name="emailPassword"
                  type="password"
                  value={emailSettings.emailPassword}
                  onChange={handleEmailSettingsChange}
                  disabled={!emailSettings.sendEmailNotifications}
                />
              </div>

              <Button 
                variant="outline"
                onClick={handleTestEmailConnection}
                disabled={!emailSettings.sendEmailNotifications}
              >
                <RefreshCcw className="h-4 w-4 mr-2" /> Test Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
