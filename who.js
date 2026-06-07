// modernwhowas.js  
  
var DB_FILE = "modernwhowas.json";  
var MAX_ENTRIES = 1000;  
  
// Initialize database on script load  
function onLoad() {  
    if (!File.exists(DB_FILE)) {  
        File.save(DB_FILE, JSON.stringify([]));  
    }  
}  
  
// Store user data when they join  
function onJoin(userobj) {  
    var data = loadDatabase();  
      
    var entry = {  
        name: userobj.name,  
        version: userobj.version,  
        externalIp: userobj.externalIp,  
        localIp: userobj.localIp,  
        timestamp: Server.Time  
    };  
      
    data.push(entry);  
      
    if (data.length > MAX_ENTRIES) {  
        data = data.slice(-MAX_ENTRIES);  
    }  
      
    saveDatabase(data);  
}  
  
// Search command  
function onCommand(userobj, command, args) {  
    if (command === "/who") {  
        searchDatabase(userobj, args);  
        return true;  
    }  
    return false;  
}  
  
function searchDatabase(userobj, query) {  
    var data = loadDatabase();  
    var results = [];  
    var search = query.toLowerCase();  
      
    for (var i = 0; i < data.length; i++) {  
        var entry = data[i];  
          
        if (entry.name.toLowerCase().indexOf(search) !== -1 ||  
            entry.externalIp.indexOf(search) !== -1 ||  
            entry.localIp.indexOf(search) !== -1) {  
            results.push(entry);  
        }  
    }  
      
    if (results.length === 0) {  
        print(userobj, "No results found for: " + query);  
    } else {  
        print(userobj, "Found " + results.length + " result(s):");  
        for (var i = 0; i < Math.min(results.length, 50); i++) {  
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
