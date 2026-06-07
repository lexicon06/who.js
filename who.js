// modernwhowas.js

var dbName = "whowas.db";

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
                Server.Time,
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
                Server.Time
            ));
        }

        sql.close();
    }
}

function onCommand(userobj, command, tUser, args) {
    if (command === "/who") {
        searchDatabase(userobj, args);
        return true;
    }
    return false;
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
            var time = new Date(entry.timestamp * 1000).toLocaleString();
            print(userobj, "Name: " + entry.name +
                " | Version: " + entry.version +
                " | External IP: " + entry.externalIp +
                " | Local IP: " + entry.localIp +
                " | Time: " + time);
        }
    }
}

onLoad();
