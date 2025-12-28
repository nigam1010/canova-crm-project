import { UserModel } from '../models/User.js';

const THRESHOLD = 3; // After 3 leads, assign to next member

// Lead assignment algorithm: Language-based with threshold rotation (3 leads per user)
export const assignLeadsToUsers = async (leads) => {
  try {
    // Get all active sales users
    const allUsers = await UserModel.findAll({ role: 'sales', status: 'Active' });

    if (allUsers.length === 0) {
      // No active users, return leads as unassigned
      return leads.map(lead => ({ ...lead, assignedTo: null }));
    }

    // Initialize session counters from DB (or assume incremental for this batch)
    // We'll track assignment counts locally for this batch to enforce the "block of 3"
    const userAssignments = {};
    allUsers.forEach(user => {
      userAssignments[user._id.toString()] = {
        user,
        currentBatchCount: (user.assignedLeads || 0) % 3, // Where they are in their current block of 3
        totalAssigned: user.assignedLeads || 0
      };
    });

    // Group users by language
    const usersByLanguage = {};
    allUsers.forEach(user => {
      const lang = user.language;
      if (!usersByLanguage[lang]) usersByLanguage[lang] = [];
      usersByLanguage[lang].push(user);
    });

    // Sort users in each language group by totalAssigned to maintain rotation order
    Object.keys(usersByLanguage).forEach(lang => {
      usersByLanguage[lang].sort((a, b) => a.assignedLeads - b.assignedLeads);
    });

    // Assign leads
    const assignedLeads = leads.map(lead => {
      const language = lead.language;
      let assignedUser = null;

      // 1. Strict Language Matching
      if (usersByLanguage[language] && usersByLanguage[language].length > 0) {
        const potentialUsers = usersByLanguage[language];

        // 2. Threshold Logic (Block of 3)
        // Find the first user who hasn't filled their block of 3 yet
        // If all have filled (e.g. 0%3=0, 1%3=1, 2%3=2. If 3%3=0, they start new block)
        // We select the user with the LEAST total assignments (FCFS acts like round robin)
        // But we must respect the "fill to 3" rule first.

        let selectedUser = null;

        // Sort by who is "in the middle" of a block (currentBatchCount > 0) 
        // effectively continuing their turn.
        // If no one is in middle, pick the one with least totalAssigned to start new block.

        // Update sorting dynamically? 
        // Simpler: Just pick the one with (assignedLeads % 3 != 0) first?
        // Actually, "threshold leads... is 3 ... fcfs and then next employee gets"
        // This implies: User A gets Lead 1, Lead 2, Lead 3. Then User B gets Lead 4...

        // Strategy:
        // Find users with (assignedLeads % 3 !== 0). Prioritize them.
        // If multiple, pick one (e.g. least overall).
        // If none (all at 0, 3, 6...), pick user with least overall assignments to start new block.

        // Get live stats from our local tracker
        const candidates = potentialUsers.map(u => userAssignments[u._id.toString()]);

        // Candidates currently filling a block
        const fillingBlock = candidates.filter(c => c.currentBatchCount > 0 && c.currentBatchCount < 3);

        if (fillingBlock.length > 0) {
          // Continue filling the current person's block
          // If multiple? (Shouldn't happen ideally if we process sequentially, but sorting ensures stability)
          fillingBlock.sort((a, b) => a.totalAssigned - b.totalAssigned);
          selectedUser = fillingBlock[0];
        } else {
          // Everyone is at a boundary (0, 3, 6...). Start new block for someone.
          // Pick person with least overall leads
          candidates.sort((a, b) => a.totalAssigned - b.totalAssigned);
          selectedUser = candidates[0];
        }

        if (selectedUser) {
          assignedUser = selectedUser.user;
          // Update local stats immediately for next lead in this batch
          selectedUser.currentBatchCount++;
          selectedUser.totalAssigned++;

          // If they hit 3, currentBatchCount becomes 0 implicitly for next logic (handled by logic above)
          if (selectedUser.currentBatchCount >= 3) {
            selectedUser.currentBatchCount = 0;
          }
        }
      }
      // Else: No match -> Unassigned (null)

      return {
        ...lead,
        assignedTo: assignedUser ? assignedUser._id.toString() : null
      };
    });

    return assignedLeads;
  } catch (error) {
    throw error;
  }
};

// Get next available user for a language (Single lead logic)
export const getNextUserForLanguage = async (language) => {
  const users = await UserModel.findAll({
    role: 'sales',
    status: 'Active',
    language: language
  });

  if (users.length === 0) {
    return null; // Unassigned
  }

  // Same logic: Check who is filling a block of 3
  const candidates = users.map(user => ({
    user,
    currentBatchCount: (user.assignedLeads || 0) % 3,
    totalAssigned: user.assignedLeads || 0
  }));

  const fillingBlock = candidates.filter(c => c.currentBatchCount > 0 && c.currentBatchCount < 3);

  if (fillingBlock.length > 0) {
    fillingBlock.sort((a, b) => a.totalAssigned - b.totalAssigned);
    return fillingBlock[0].user;
  } else {
    candidates.sort((a, b) => a.totalAssigned - b.totalAssigned);
    return candidates[0].user;
  }
};
