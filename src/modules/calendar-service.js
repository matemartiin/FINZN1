import { supabase } from '../config/supabase.js';

export class CalendarService {
  /**
   * List events for a user within a date range
   * @param {string} userId - User ID
   * @param {string} monthStartISO - Start date in ISO format (YYYY-MM-DD)
   * @param {string} monthEndISO - End date in ISO format (YYYY-MM-DD)
   * @returns {Promise<{data: Array, error: any}>}
   */
  async listEvents(userId, monthStartISO, monthEndISO) {
    try {
      if (!userId) {
        console.error('CalendarService: No userId provided');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      console.log('CalendarService: Querying events for user:', userId);
      console.log('CalendarService: Date range:', monthStartISO, 'to', monthEndISO);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('date', monthStartISO)
        .lte('date', monthEndISO)
        .order('date', { ascending: true });

      if (error) {
        console.error('CalendarService: Database error loading events:', error);
        return { data: null, error };
      }

      console.log('CalendarService: Query successful, found', (data || []).length, 'events');
      return { data: data || [], error: null };
    } catch (error) {
      console.error('CalendarService: Exception in listEvents:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new calendar event
   * @param {Object} event - Event data
   * @returns {Promise<{data: Object, error: any}>}
   */
  async createEvent(event) {
    try {
      if (!event.user_id) {
        console.error('CalendarService: No user_id provided in event data');
        return { data: null, error: { message: 'Usuario no autenticado' } };
      }

      const eventData = {
        user_id: event.user_id,
        title: event.title,
        type: event.type,
        date: event.date,
        time: event.time || null,
        amount: event.amount ? parseFloat(event.amount) : null,
        description: event.description || null,
        recurring: event.recurring || false,
        frequency: event.frequency || null,
        parent_id: event.parent_id || null
      };

      console.log('CalendarService: Creating event with data:', eventData);

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('CalendarService: Database error creating event:', error);
        return { data: null, error };
      }

      console.log('CalendarService: Event created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('CalendarService: Exception in createEvent:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing calendar event
   * @param {string} eventId - Event ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<{data: Object, error: any}>}
   */
  async updateEvent(eventId, updates) {
    try {
      if (!eventId) {
        return { data: null, error: { message: 'ID de evento requerido' } };
      }

      // Prepare updates object
      const updateData = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.time !== undefined) updateData.time = updates.time || null;
      if (updates.amount !== undefined) updateData.amount = updates.amount ? parseFloat(updates.amount) : null;
      if (updates.description !== undefined) updateData.description = updates.description || null;
      if (updates.recurring !== undefined) updateData.recurring = updates.recurring;
      if (updates.frequency !== undefined) updateData.frequency = updates.frequency || null;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) {
        console.error('Error updating calendar event:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEvent:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a calendar event
   * @param {string} eventId - Event ID
   * @returns {Promise<{data: boolean, error: any}>}
   */
  async deleteEvent(eventId) {
    try {
      if (!eventId) {
        return { data: false, error: { message: 'ID de evento requerido' } };
      }

      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) {
        console.error('Error deleting calendar event:', error);
        return { data: false, error };
      }

      return { data: true, error: null };
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      return { data: false, error };
    }
  }

  /**
   * Create recurring events based on a parent event
   * @param {Object} baseEvent - Base event data
   * @param {number} monthsAhead - Number of months to create events for
   * @returns {Promise<{data: Array, error: any}>}
   */
  async createRecurringEvents(baseEvent, monthsAhead = 12) {
    try {
      if (!baseEvent.recurring || !baseEvent.frequency) {
        return { data: [], error: null };
      }

      const startDate = new Date(baseEvent.date);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsAhead);

      const recurringEvents = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        if (baseEvent.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (baseEvent.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else if (baseEvent.frequency === 'yearly') {
          currentDate.setFullYear(currentDate.getFullYear() + 1);
        } else {
          break;
        }

        if (currentDate <= endDate) {
          const recurringEvent = {
            ...baseEvent,
            date: currentDate.toISOString().split('T')[0],
            parent_id: baseEvent.id
          };
          delete recurringEvent.id; // Remove ID so it gets a new one
          recurringEvents.push(recurringEvent);
        }
      }

      if (recurringEvents.length === 0) {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('calendar_events')
        .insert(recurringEvents)
        .select();

      if (error) {
        console.error('Error creating recurring events:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error in createRecurringEvents:', error);
      return { data: null, error };
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();