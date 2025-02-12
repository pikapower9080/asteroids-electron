import fs from "fs"

if (!fs.existsSync(".env")) {
	fs.writeFileSync(".env", fs.readFileSync(".env.example", "utf-8"))
	console.log("Created .env file")
}