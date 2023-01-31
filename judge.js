const Discord = require('discord.js');
const client = new Discord.Client();
const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;
const uri = "mongodb+srv://<your_mongo_db_uri_here>";

let bannedUsers;

MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, db) {
    if (err) throw err;
    const dbo = db.db("test");
    dbo.collection("bannedUsers").find({}).toArray(function(err, result) {
        if (err) throw err;
        bannedUsers = result;
        console.log("Banned users list loaded");
        db.close();
    });
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('guildMemberAdd', member => {
    for (let i = 0; i < bannedUsers.length; i++) {
        if (bannedUsers[i].discordID === member.id) {
            if (bannedUsers[i].appearance === 1) {
                member.send("WARNING: You have been banned from other servers. Contact a server admin for more information.");
            } else {
                member.send("CRITICAL: You have been banned multiple times. Contact a server admin for more information.");
            }
            return;
        }
    }
    member.send("OK: Welcome to the server!");
});

client.on('message', msg => {
    if (msg.content.startsWith('/judge ban')) {
        let banCommand = msg.content.split(" ");
        if (banCommand.length < 4) {
            msg.reply("Incorrect syntax for ban command. Use '/judge ban @user reason'");
            return;
        }
        let bannedUser = msg.mentions.users.first();
        if (!bannedUser) {
            msg.reply("Incorrect syntax for ban command. Use '/judge ban @user reason'");
            return;
        }
        let reason = banCommand.slice(3).join(" ");
        let server = msg.guild.name;
        let moderator = msg.author.id;
        let bannedUserIndex = -1;
        for (let i = 0; i < bannedUsers.length; i++) {
            if (bannedUsers[i].discordID === bannedUser.id) {
                bannedUserIndex = i;
                break;
            }
        }
        if (bannedUserIndex === -1) {
            bannedUsers.push({ discordID: bannedUser.id, reason: reason, server: server, appearance: 1 });
        } else {
            bannedUsers[bannedUserIndex].appearance++;
        }
        MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true
