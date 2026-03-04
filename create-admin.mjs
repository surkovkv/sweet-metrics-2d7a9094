// Script to create the admin account in Supabase
// Run with: node create-admin.mjs

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Try to load local env
config({ path: ".env.local" });
config({ path: ".env" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env");
    console.error("Please create a .env.local file with these values.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
    console.log("📧 Creating admin account: ki6real6ki@gmail.com ...");

    // Sign up
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: "ki6real6ki@gmail.com",
        password: "VDFujiF216!",
        options: {
            data: {
                nickname: "admin",
            },
        },
    });

    if (signUpError) {
        console.error("❌ Sign up error:", signUpError.message);
        return;
    }

    const userId = authData?.user?.id;
    console.log("✅ Auth user created:", userId);

    if (!userId) {
        console.error("❌ No user ID returned. The account may need email confirmation first.");
        console.log("👉 Check your inbox at ki6real6ki@gmail.com and confirm the email.");
        return;
    }

    // Wait a moment for profile trigger to fire
    await new Promise((r) => setTimeout(r, 1500));

    // Upsert the profile with nickname = "admin" and is_pro = true
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            user_id: userId,
            nickname: "admin",
            is_pro: true,
        });

    if (profileError) {
        console.error("⚠️  Profile upsert error:", profileError.message);
        console.log("👉 You may need to manually set nickname='admin' in Supabase profiles table.");
    } else {
        console.log("✅ Profile updated: nickname=admin, is_pro=true");
    }

    console.log("\n🎉 Done! Login credentials:");
    console.log("   Email:    ki6real6ki@gmail.com");
    console.log("   Password: VDFujiF216!");
    console.log("   Nickname: admin");
    console.log("\n📧 Check email for Supabase confirmation link if required.");
}

createAdmin();
