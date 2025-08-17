// Google Calendar Sync Fix Module
// Fixes synchronization issues with Google Calendar

export class CalendarSyncFix {
  constructor(calendarManager) {
    this.calendar = calendarManager;
    this.syncQueue = new Map(); // Track events being synced
    this.preventSyncLoop = false;
  }

  // Enhanced delete method with Google Calendar sync
  async deleteEventWithSync(eventId) {
    console.log('🗑️ Starting delete with sync for event:', eventId);
    
    try {
      // Find the event first
      const event = this.calendar.events.find(e => e.id === eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      // If event has Google ID, delete from Google Calendar first
      if (event.google_event_id && this.calendar.googleCalendarIntegration) {
        await this.deleteFromGoogleCalendar(event.google_event_id);
      }

      // Then delete from local/Supabase
      await this.calendar.deleteEvent(eventId);
      
      console.log('✅ Event deleted successfully from both systems');
      return true;
      
    } catch (error) {
      console.error('❌ Error in deleteEventWithSync:', error);
      throw error;
    }
  }

  // Delete event from Google Calendar
  async deleteFromGoogleCalendar(googleEventId) {
    if (!this.calendar.accessToken || !window.gapi?.client) {
      console.log('⏭️ Skipping Google deletion - no access token or API');
      return;
    }

    try {
      window.gapi.client.setToken({access_token: this.calendar.accessToken});
      
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId
      });
      
      console.log('✅ Event deleted from Google Calendar:', googleEventId);
      
    } catch (error) {
      console.error('❌ Error deleting from Google Calendar:', error);
      // Don't throw - we can still delete locally
    }
  }

  // Enhanced add event with Google sync tracking
  async addEventWithSync(eventData) {
    console.log('➕ Adding event with sync:', eventData.title);
    
    // Add sync metadata
    const enhancedEventData = {
      ...eventData,
      sync_source: eventData.sync_source || 'finzn',
      sync_version: 1,
      last_synced_at: new Date().toISOString()
    };

    // If this is from Google import, mark it
    if (eventData.google_event_id) {
      enhancedEventData.sync_source = 'google';
    }

    return await this.calendar.addEvent(enhancedEventData);
  }

  // Improved duplicate detection
  findDuplicateEvent(newEvent, existingEvents) {
    return existingEvents.find(existing => {
      // If both have Google IDs, compare them
      if (newEvent.google_event_id && existing.google_event_id) {
        return newEvent.google_event_id === existing.google_event_id;
      }

      // Otherwise use enhanced matching
      const titleMatch = existing.title === newEvent.title;
      const dateMatch = existing.date === newEvent.date;
      const timeMatch = (!existing.time && !newEvent.time) || (existing.time === newEvent.time);
      
      // Be more strict about duplicates
      const descriptionSimilar = this.areDescriptionsSimilar(existing.description, newEvent.description);
      
      return titleMatch && dateMatch && timeMatch && descriptionSimilar;
    });
  }

  // Check if descriptions are similar (for duplicate detection)
  areDescriptionsSimilar(desc1, desc2) {
    if (!desc1 && !desc2) return true;
    if (!desc1 || !desc2) return false;
    
    // Remove common sync phrases for comparison
    const clean1 = this.cleanDescriptionForComparison(desc1);
    const clean2 = this.cleanDescriptionForComparison(desc2);
    
    return clean1 === clean2;
  }

  cleanDescriptionForComparison(description) {
    if (!description) return '';
    
    return description
      .replace(/Importado de Google Calendar/g, '')
      .replace(/Exported to Google Calendar/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Enhanced import from Google with better duplicate handling
  async enhancedImportFromGoogle() {
    if (!this.calendar.googleCalendarIntegration || this.preventSyncLoop) {
      return;
    }

    console.log('📥 Starting enhanced Google import...');
    
    try {
      this.preventSyncLoop = true;
      
      // Get events from Google
      const googleEvents = await this.getGoogleCalendarEvents();
      
      let importedCount = 0;
      const now = new Date();
      
      for (const googleEvent of googleEvents) {
        try {
          // Skip events that are too old or far in future
          const eventDate = new Date(googleEvent.start?.date || googleEvent.start?.dateTime);
          const daysDiff = Math.abs((eventDate - now) / (1000 * 60 * 60 * 24));
          
          if (daysDiff > 90) { // Skip events more than 90 days away
            continue;
          }

          const finznEvent = this.convertGoogleToFinznEvent(googleEvent);
          if (!finznEvent) continue;

          // Check for existing event by Google ID first
          const existingByGoogleId = this.calendar.events.find(e => 
            e.google_event_id === googleEvent.id
          );

          if (existingByGoogleId) {
            console.log('⏭️ Skipping - already imported:', googleEvent.summary);
            continue;
          }

          // Check for duplicates by content
          const eventsOnDate = this.calendar.getEventsForDate(new Date(finznEvent.date));
          const duplicate = this.findDuplicateEvent(finznEvent, eventsOnDate);

          if (duplicate) {
            // If duplicate doesn't have Google ID, update it
            if (!duplicate.google_event_id) {
              await this.updateEventWithGoogleId(duplicate.id, googleEvent.id);
              console.log('🔗 Linked existing event to Google:', duplicate.title);
            }
            continue;
          }

          // Import new event
          await this.addEventWithSync({
            ...finznEvent,
            google_event_id: googleEvent.id,
            sync_source: 'google'
          });
          
          importedCount++;
          console.log('✅ Imported:', googleEvent.summary);
          
        } catch (eventError) {
          console.error('❌ Error importing individual event:', eventError);
        }
      }

      if (importedCount > 0) {
        this.calendar.renderCalendar();
        this.calendar.updateUpcomingEventsCount();
        
        if (window.app?.ui) {
          window.app.ui.showAlert(
            `✅ ${importedCount} eventos importados desde Google Calendar`, 
            'success', 
            3000
          );
        }
      }

      console.log(`📥 Import completed: ${importedCount} new events`);
      
    } catch (error) {
      console.error('❌ Error in enhancedImportFromGoogle:', error);
    } finally {
      this.preventSyncLoop = false;
    }
  }

  // Get events from Google Calendar with proper error handling
  async getGoogleCalendarEvents() {
    if (!this.calendar.accessToken || !window.gapi?.client) {
      return [];
    }

    try {
      window.gapi.client.setToken({access_token: this.calendar.accessToken});
      
      const now = new Date();
      const timeMin = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const timeMax = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ahead
      
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: 100,
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false // Don't include deleted events
      });
      
      return response.result.items || [];
      
    } catch (error) {
      console.error('❌ Error fetching Google Calendar events:', error);
      return [];
    }
  }

  // Convert Google event to FINZN format
  convertGoogleToFinznEvent(googleEvent) {
    // Use the existing method from calendar manager
    return this.calendar.convertGoogleToFinznEvent(googleEvent);
  }

  // Determine event type from Google event
  determineEventType(googleEvent) {
    const title = googleEvent.summary?.toLowerCase() || '';
    const description = googleEvent.description?.toLowerCase() || '';
    const combined = `${title} ${description}`;

    if (combined.includes('pago') || combined.includes('tarjeta') || combined.includes('cuota')) {
      return 'payment';
    }
    if (combined.includes('cobro') || combined.includes('ingreso') || combined.includes('sueldo')) {
      return 'income';
    }
    if (combined.includes('cierre') || combined.includes('vencimiento')) {
      return 'deadline';
    }
    if (combined.includes('recordatorio') || combined.includes('reminder')) {
      return 'reminder';
    }
    
    return 'reminder'; // Default type
  }

  // Update existing event with Google ID
  async updateEventWithGoogleId(eventId, googleEventId) {
    try {
      const calendarService = window.app?.data?.calendarService;
      if (!calendarService) return;

      const updateData = {
        google_event_id: googleEventId,
        sync_source: 'bidirectional',
        last_synced_at: new Date().toISOString()
      };

      await calendarService.updateEvent(eventId, updateData);
      
      // Update local events array
      const eventIndex = this.calendar.events.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        Object.assign(this.calendar.events[eventIndex], updateData);
      }
      
    } catch (error) {
      console.error('❌ Error updating event with Google ID:', error);
    }
  }

  // Safer auto-sync with longer intervals
  startSaferAutoSync() {
    // Stop any existing sync
    this.stopAutoSync();

    // Reduce frequency to avoid rate limits and loops
    const syncInterval = 5 * 60 * 1000; // 5 minutes instead of 30 seconds
    
    console.log('🔄 Starting safer auto-sync (every 5 minutes)');
    
    this.calendar.autoSyncPollingInterval = setInterval(async () => {
      try {
        if (!this.preventSyncLoop && this.calendar.googleCalendarIntegration) {
          await this.enhancedImportFromGoogle();
        }
      } catch (error) {
        console.error('❌ Auto-sync error:', error);
      }
    }, syncInterval);
  }

  stopAutoSync() {
    if (this.calendar.autoSyncPollingInterval) {
      clearInterval(this.calendar.autoSyncPollingInterval);
      this.calendar.autoSyncPollingInterval = null;
      console.log('🛑 Auto-sync stopped');
    }
  }
}