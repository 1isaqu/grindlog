import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { CloudUpload, CloudDownload, RefreshCw, User } from "lucide-react";
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Settings() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Get or create user ID
    let storedId = localStorage.getItem('gymlog_user_id');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('gymlog_user_id', storedId);
    }
    setUserId(storedId);

    const storedSync = localStorage.getItem('gymlog_last_sync');
    if (storedSync) setLastSync(storedSync);
  }, []);

  const handleSyncToCloud = async () => {
    setLoading(true);
    try {
      const exercises = await db.exercises.toArray();
      const logs = await db.logs.toArray();

      const payload = {
        userId,
        exercises,
        logs
      };

      const res = await axios.post(`${BACKEND_URL}/api/backup`, payload);

      const timestamp = new Date().toLocaleString();
      setLastSync(timestamp);
      localStorage.setItem('gymlog_last_sync', timestamp);
      toast.success("Backup successful!");
    } catch (error) {
      console.error(error);
      toast.error("Backup failed. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!window.confirm("This will overwrite your local data. Are you sure?")) return;

    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/backup/${userId}`);
      const data = res.data;

      if (data) {
        await db.transaction('rw', db.exercises, db.logs, async () => {
          await db.exercises.clear();
          await db.logs.clear();

          if (data.exercises?.length) await db.exercises.bulkAdd(data.exercises);
          if (data.logs?.length) await db.logs.bulkAdd(data.logs);
        });

        toast.success("Data restored successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Restore failed. No backup found or connection error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Settings</h1>

      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              User Identity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              This ID is your key to restore data. Keep it safe.
            </p>
            <div className="bg-secondary p-3 rounded font-mono text-xs break-all select-all border border-border">
              {userId}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Cloud Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Last Synced: <span className="text-foreground">{lastSync || 'Never'}</span>
            </div>

            <Button
              onClick={handleSyncToCloud}
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/80 text-white border border-border"
              data-testid="sync-btn"
            >
              <CloudUpload className="mr-2 h-4 w-4" />
              {loading ? 'Syncing...' : 'Backup to Cloud'}
            </Button>

            <Button
              onClick={handleRestoreFromCloud}
              disabled={loading}
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid="restore-btn"
            >
              <CloudDownload className="mr-2 h-4 w-4" />
              {loading ? 'Restoring...' : 'Restore from Cloud'}
            </Button>
          </CardContent>
        </Card>

        <div className="text-xs text-center text-muted-foreground mt-8">
          GymLog v1.0.0 • Local First
        </div>
      </div>
    </div>
  );
}
