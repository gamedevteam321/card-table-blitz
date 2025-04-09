

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_room_code"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-digit number
        new_code := LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
        
        -- Check if code exists
        SELECT EXISTS (
            SELECT 1 FROM rooms WHERE code = new_code
        ) INTO code_exists;
        
        -- Exit loop if code doesn't exist
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN new_code;
END;
$$;


ALTER FUNCTION "public"."generate_room_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "games_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "card_played" "text" NOT NULL,
    "position" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_readiness" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "is_ready" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."player_readiness" OWNER TO "postgres";


COMMENT ON COLUMN "public"."player_readiness"."is_ready" IS 'Whether the player is ready to start the game';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "current_turn" "uuid",
    "status" "text" DEFAULT 'waiting'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "code" character varying(6) NOT NULL,
    "amount_stack" integer DEFAULT 0 NOT NULL,
    "max_players" integer DEFAULT 2 NOT NULL,
    CONSTRAINT "rooms_max_players_check" CHECK (("max_players" = ANY (ARRAY[2, 4]))),
    CONSTRAINT "rooms_status_check" CHECK (("status" = ANY (ARRAY['waiting'::"text", 'playing'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."rooms" OWNER TO "postgres";


COMMENT ON COLUMN "public"."rooms"."amount_stack" IS 'The amount of stack required to enter the game room';



COMMENT ON COLUMN "public"."rooms"."max_players" IS 'Maximum number of players allowed in the room (2 or 4)';



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moves"
    ADD CONSTRAINT "moves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_readiness"
    ADD CONSTRAINT "player_readiness_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_readiness"
    ADD CONSTRAINT "player_readiness_room_id_player_id_key" UNIQUE ("room_id", "player_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_games_room_id" ON "public"."games" USING "btree" ("room_id");



CREATE INDEX "idx_moves_player_id" ON "public"."moves" USING "btree" ("player_id");



CREATE INDEX "idx_moves_room_id" ON "public"."moves" USING "btree" ("room_id");



CREATE INDEX "idx_player_readiness_player_id" ON "public"."player_readiness" USING "btree" ("player_id");



CREATE INDEX "idx_player_readiness_room_id" ON "public"."player_readiness" USING "btree" ("room_id");



CREATE INDEX "idx_rooms_code" ON "public"."rooms" USING "btree" ("code");



CREATE INDEX "idx_rooms_created_by" ON "public"."rooms" USING "btree" ("created_by");



CREATE INDEX "idx_rooms_current_turn" ON "public"."rooms" USING "btree" ("current_turn");



CREATE OR REPLACE TRIGGER "update_games_updated_at" BEFORE UPDATE ON "public"."games" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_player_readiness_updated_at" BEFORE UPDATE ON "public"."player_readiness" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_rooms_updated_at" BEFORE UPDATE ON "public"."rooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."games"
    ADD CONSTRAINT "games_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moves"
    ADD CONSTRAINT "moves_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."moves"
    ADD CONSTRAINT "moves_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_readiness"
    ADD CONSTRAINT "player_readiness_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."player_readiness"
    ADD CONSTRAINT "player_readiness_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_current_turn_fkey" FOREIGN KEY ("current_turn") REFERENCES "auth"."users"("id");



CREATE POLICY "Anyone can create rooms" ON "public"."rooms" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Anyone can read moves" ON "public"."moves" FOR SELECT USING (true);



CREATE POLICY "Anyone can read player readiness" ON "public"."player_readiness" FOR SELECT USING (true);



CREATE POLICY "Anyone can read profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Anyone can read rooms" ON "public"."rooms" FOR SELECT USING (true);



CREATE POLICY "Host can create multiple moves" ON "public"."moves" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."rooms"
  WHERE (("rooms"."id" = "moves"."room_id") AND ("rooms"."created_by" = "auth"."uid"()) AND ("rooms"."status" = 'playing'::"text")))));



CREATE POLICY "Only creator can update room" ON "public"."rooms" FOR UPDATE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Players can create moves" ON "public"."moves" FOR INSERT WITH CHECK ((("auth"."uid"() = "player_id") AND (EXISTS ( SELECT 1
   FROM "public"."rooms"
  WHERE (("rooms"."id" = "moves"."room_id") AND ("rooms"."status" = 'waiting'::"text"))))));



CREATE POLICY "Players can create their own readiness" ON "public"."player_readiness" FOR INSERT WITH CHECK (("auth"."uid"() = "player_id"));



CREATE POLICY "Players can update their own readiness" ON "public"."player_readiness" FOR UPDATE USING (("auth"."uid"() = "player_id"));



CREATE POLICY "Users can create their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_readiness" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_room_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."games" TO "anon";
GRANT ALL ON TABLE "public"."games" TO "authenticated";
GRANT ALL ON TABLE "public"."games" TO "service_role";



GRANT ALL ON TABLE "public"."moves" TO "anon";
GRANT ALL ON TABLE "public"."moves" TO "authenticated";
GRANT ALL ON TABLE "public"."moves" TO "service_role";



GRANT ALL ON TABLE "public"."player_readiness" TO "anon";
GRANT ALL ON TABLE "public"."player_readiness" TO "authenticated";
GRANT ALL ON TABLE "public"."player_readiness" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
