import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const dummyUsers = [
  {
    email: 'player1@example.com',
    password: 'password123',
    username: 'Player1',
    avatarSeed: 'player1'
  },
  {
    email: 'player2@example.com',
    password: 'password123',
    username: 'Player2',
    avatarSeed: 'player2'
  },
  {
    email: 'player3@example.com',
    password: 'password123',
    username: 'Player3',
    avatarSeed: 'player3'
  },
  {
    email: 'player4@example.com',
    password: 'password123',
    username: 'Player4',
    avatarSeed: 'player4'
  }
];

async function createDummyUsers() {
  for (const user of dummyUsers) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`Error creating auth user for ${user.email}:`, authError);
        continue;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: user.username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatarSeed}`
        });

      if (profileError) {
        console.error(`Error creating profile for ${user.email}:`, profileError);
        continue;
      }

      console.log(`Successfully created user: ${user.email}`);
    } catch (error) {
      console.error(`Error processing user ${user.email}:`, error);
    }
  }
}

createDummyUsers(); 