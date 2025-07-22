import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_API_KEY!
);

export { supabase };
