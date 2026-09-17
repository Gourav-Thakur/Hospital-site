// Usage: npm run hash-password -- "yourStrongPassword"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH in .env.local
import bcrypt from "bcryptjs";

const pw = process.argv[2];
if (!pw) {
  console.error('Provide a password:  npm run hash-password -- "yourStrongPassword"');
  process.exit(1);
}

// bcrypt hashes contain `$` which env-file parsers (dotenv) try to expand as
// variables, corrupting the value. base64-encode so it is safe in .env.local AND
// when pasted into the Vercel dashboard. The login route decodes it before comparing.
const hash = bcrypt.hashSync(pw, 12);
const encoded = Buffer.from(hash, "utf8").toString("base64");
console.log("\nADMIN_PASSWORD_HASH=" + encoded + "\n");
