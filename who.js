// modernwhowas.js  
  
var DB_FILE = "modernwhowas.db";  
var MAX_ENTRIES = 1000;  
  
// Initialize database on script load  
function onLoad() {  
    if (!File.exists(DB_FILE)) {  
        File.save(DB_FILE, JSON.stringify([]));  
    }  
}  
  
// Store user data when they join  
function onJoin(user) {  
    var data = loadDatabase();  
      
    var entry = {  
        name: user.name,  
        version: user.version,  
        externalIp: user.externalIp,  
        localIp: user.localIp,  
        timestamp: Server.Time  
    };  
      
    // Add new entry  
    data.push(entry);  
      
    // Keep only recent entries  
    if (data.length > MAX_ENTRIES) {  
        data = data.slice(-MAX_ENTRIES);  
    }  
      
    saveDatabase(data);  
}  
  
// Search command  
function onCommand(user, command, args) {  
    if (command === "/who") {  
        searchDatabase(user, args);  
        return true;  
    }  
    return false;  
}  
  
function searchDatabase(user, query) {  
    var data = loadDatabase();  
    var results = [];  
    var search = query.toLowerCase();  
      
    for (var i = 0; i < data.length; i++) {  
        var entry = data[i];  
          
        // Search by name, external IP, or local IP  
        if (entry.name.toLowerCase().indexOf(search) !== -1 ||  
            entry.externalIp.indexOf(search) !== -1 ||  
            entry.localIp.indexOf(search) !== -1) {  
            results.push(entry);  
        }  
    }  
      
    if (results.length === 0) {  
        user.sendText("No results found for: " + query);  
    } else {  
        user.sendText("Found " + results.length + " result(s):");  
        for (var i = 0; i < Math.min(results.length, 50); i++) {  
            var entry = results[i];  
            var time = new Date(entry.timestamp * 1000).toLocaleString();  
            user.sendText("Name: " + entry.name +   
                         " | Version: " + entry.version +  
                         " | External IP: " + entry.externalIp +  
                         " | Local IP: " + entry.localIp +  
                         " | Time: " + time);  
        }  
    }  
}  
  
function loadDatabase() {  
    try {  
        var content = File.load(DB_FILE);  
        return JSON.parse(content);  
    } catch (e) {  
        return [];  
    }  
}  
  
function saveDatabase(data) {  
    File.save(DB_FILE, JSON.stringify(data));  
}
