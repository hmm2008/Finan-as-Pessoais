const fs = require('fs');
let content = fs.readFileSync('src/contexts/PreferencesContext.tsx', 'utf-8');

// The block to replace
const blockToReplace = `  useEffect(() => {
    let unsubscribeListener: (() => void) | null = null;

    const handleCloudSnapshot = (cloudData: Partial<UserPreferences>) => {
      const current = prefsRef.current;

      // Ignore echoes from recent local user interactions (within 2 seconds)
      if (Date.now() - lastLocalUpdateTimestampRef.current < 2000) {
        return;
      }

      // Check timestamp ordering
      const localTime = current.updatedAt ? new Date(current.updatedAt).getTime() : 0;
      const cloudTime = cloudData.updatedAt ? new Date(cloudData.updatedAt).getTime() : 0;

      if (cloudTime > 0 && localTime > 0 && cloudTime < localTime) {
        return;
      }

      const merged: UserPreferences = {
        ...current,
        ...cloudData,
        navLabels: { ...(current.navLabels || {}), ...(cloudData.navLabels || {}) },
        pageTitles: { ...(current.pageTitles || {}), ...(cloudData.pageTitles || {}) },
        pageSubtitles: { ...(current.pageSubtitles || {}), ...(cloudData.pageSubtitles || {}) },
        updatedAt: cloudData.updatedAt || current.updatedAt
      };

      // Strict deep equality check to prevent redundant re-renders / loops
      if (isDeepEqual(merged, current)) {
        return;
      }

      setPrefs(merged);
      try {
        localStorage.setItem('finanas_user_prefs', JSON.stringify(merged));
      } catch (e) {}
    };

    const attachListener = (targetId: string) => {
      if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
      }

      const docRef = doc(db, 'user_preferences', targetId);
      unsubscribeListener = onSnapshot(docRef, async (snap) => {
        // Ignore snapshots with pending local writes
        if (snap.metadata.hasPendingWrites) {
          return;
        }

        if (snap.exists()) {
          handleCloudSnapshot(snap.data() as Partial<UserPreferences>);
        } else if (targetId !== 'global_shared') {
          try {
            const globalSnap = await getDoc(doc(db, 'user_preferences', 'global_shared'));
            if (globalSnap.exists()) {
              handleCloudSnapshot(globalSnap.data() as Partial<UserPreferences>);
            }
          } catch (err) {
            console.warn('Error reading fallback global_shared:', err);
          }
        }
      }, (err) => {
        console.warn(\`Firestore user_preferences (\${targetId}) listener error:\`, err);
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      const targetId = user ? user.uid : 'global_shared';
      attachListener(targetId);
    });

    return () => {
      if (unsubscribeListener) unsubscribeListener();
      unsubscribeAuth();
    };
  }, []);`;

content = content.replace(blockToReplace, '// Firestore listener removed for full Google Drive integration');
fs.writeFileSync('src/contexts/PreferencesContext.tsx', content);
