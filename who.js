// modernwhowas.js

var dbName = "whowas.db";

function getCurrentTimestamp() {
    return Math.floor(Date.now() / 1000); // Unix timestamp in seconds
}

function onLoad() {
    var sql = new Sql();
    sql.open(dbName);
    if (sql.connected) {
        var query = new Query("CREATE TABLE IF NOT EXISTS whowas (id INTEGER PRIMARY KEY AUTOINCREMENT, name NVARCHAR(255), version NVARCHAR(50), externalIp NVARCHAR(50), localIp NVARCHAR(50), timestamp INTEGER)");
        sql.query(query);
        sql.close();
    }
}

function onJoin(userobj) {
    var sql = new Sql();
    sql.open(dbName);
    if (sql.connected) {
        var currentTime = getCurrentTimestamp();
        
        // Check if this IP combo already exists
        var checkQuery = new Query(
            "SELECT id FROM whowas WHERE externalIp = {0} AND localIp = {1}",
            userobj.externalIp,
            userobj.localIp
        );
        sql.query(checkQuery);

        if (sql.read) {
            // Already exists — just update name, version and timestamp
            var existingId = sql.value("id");
            sql.query(new Query(
                "UPDATE whowas SET name = {0}, version = {1}, timestamp = {2} WHERE id = {3}",
                userobj.name,
                userobj.version,
                currentTime,
                existingId
            ));
        } else {
            // New IP combo — trim if over limit then insert
            var countQuery = new Query("SELECT COUNT(*) as count FROM whowas");
            sql.query(countQuery);
            if (sql.read) {
                var count = sql.value("count");
                if (count >= 1000) {
                    sql.query(new Query(
                        "DELETE FROM whowas WHERE id IN (SELECT id FROM whowas ORDER BY id ASC LIMIT " + (count - 999) + ")"
                    ));
                }
            }

            sql.query(new Query(
                "INSERT INTO whowas (name, version, externalIp, localIp, timestamp) VALUES ({0}, {1}, {2}, {3}, {4})",
                userobj.name,
                userobj.version,
                userobj.externalIp,
                userobj.localIp,
                currentTime
            ));
        }

        sql.close();
    }
}

function onCommand(userobj, command, tUser, args) {
    if (command.substring(0,4) === "who " && userobj.level > 0) {
        var query = command.substring(4).trim();
        searchDatabase(userobj, query);
    }
}

function formatTimestamp(timestamp) {
    if (!timestamp) return "Unknown";
    var date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

function searchDatabase(userobj, query) {
    var sql = new Sql();
    sql.open(dbName);
    if (!sql.connected) {
        print(userobj, "Error connecting to database.");
        return;
    }

    var searchQuery = new Query(
        "SELECT * FROM whowas WHERE name LIKE {0} OR externalIp LIKE {1} OR localIp LIKE {2} ORDER BY id DESC LIMIT 50",
        "%" + query + "%",
        "%" + query + "%",
        "%" + query + "%"
    );
    sql.query(searchQuery);

    var results = [];
    while (sql.read) {
        results.push({
            name: sql.value("name"),
            version: sql.value("version"),
            externalIp: sql.value("externalIp"),
            localIp: sql.value("localIp"),
            timestamp: sql.value("timestamp")
        });
    }
    sql.close();

    if (results.length === 0) {
        print(userobj, "No results found for: " + query);
    } else {
        print(userobj, "Found " + results.length + " result(s):");
        for (var i = 0; i < results.length; i++) {
            var entry = results[i];
            var time = formatTimestamp(entry.timestamp);
            print(userobj, "Name: " + entry.name);
            print(userobj, " | Version: " + entry.version);
            print(userobj, " | External IP: " + entry.externalIp);
            print(userobj, " | Local IP: " + entry.localIp);
            print(userobj, " | Time: " + time);
        }
    }
}

onLoad();
