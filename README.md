# Game Hub

A full-stack web application for creating and joining game rooms with real-time communication.

## Features

- User authentication with Supabase
- Create and join game rooms
- Real-time chat and user presence
- Room management (public/private, player limits, stake values)
- WebSocket-based real-time updates

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Socket.IO Client for real-time communication

### Backend
- Node.js with TypeScript
- Express.js for REST API
- Socket.IO for real-time communication
- Supabase for authentication and database

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/game-hub.git
cd game-hub
```

2. Set up Supabase:
- Create a new project in Supabase
- Enable Email authentication
- Create the following tables:
  ```sql
  -- rooms table
  create table rooms (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    type text not null check (type in ('public', 'private')),
    game_type text not null,
    max_players integer not null,
    stake_value numeric not null,
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    status text not null check (status in ('waiting', 'playing', 'finished'))
  );

  -- room_participants table
  create table room_participants (
    room_id uuid references rooms(id),
    user_id uuid references auth.users(id),
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    is_host boolean default false,
    primary key (room_id, user_id)
  );

  -- room_messages table
  create table room_messages (
    id uuid default uuid_generate_v4() primary key,
    room_id uuid references rooms(id),
    user_id uuid references auth.users(id),
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
  );
  ```

3. Set up environment variables:
- Copy `.env.example` to `.env` in both client and server directories
- Fill in your Supabase credentials and other configuration

4. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

5. Start the development servers:
```bash
# Start the server
cd server
npm run dev

# Start the client (in a new terminal)
cd client
npm run dev
```

The application should now be running at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Project Structure

```
game-hub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── types/         # TypeScript types
│   │   └── App.tsx        # Main app component
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── socket/        # Socket.IO handlers
│   │   ├── types/         # TypeScript types
│   │   └── index.ts       # Server entry point
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 