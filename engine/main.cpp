#include <iostream>
#include <vector>
#include <string>
#include "json.hpp"
#include "models.h"
#include "graph.h"

using namespace std;
using json = nlohmann::json;

int main() {
    // 1. Read the entire JSON input from standard input (cin)
    string input_data;
    string line;
    while (getline(cin, line)) {
        input_data += line;
    }

    // If no input was provided, just exit safely
    if (input_data.empty()) {
        return 0;
    }

    // 2. Parse the raw string into a JSON object
    json parsed = json::parse(input_data);
    vector<Router> routers;
    vector<Wall> walls;

    // 3. Convert JSON array to C++ Router vector
    if (parsed.contains("routers")) {
        for (auto& item : parsed["routers"]) {
            Router r;
            r.id = item["id"];
            r.x = item["x"];
            r.y = item["y"];
            r.z = item["z"];
            r.baseRadius = item["baseRadius"];
            r.channel = item["channel"];
            routers.push_back(r);
        }
    }

    // 4. Convert JSON array to C++ Wall vector
    if (parsed.contains("walls")) {
        for (auto& item : parsed["walls"]) {
            Wall w;
            w.id = item["id"];
            w.startX = item["startX"];
            w.startY = item["startY"];
            w.endX = item["endX"];
            w.endY = item["endY"];
            w.material = static_cast<MaterialType>(item["material"]);
            walls.push_back(w);
        }
    }

    // 5. Compute every interfering / blocked pair, then run channel assignment
    //    using only the TRUE interference edges (not wall-blocked ones).
    vector<RouterEdge> edges = computeEdges(routers, walls);
    vector<vector<int>> adjList = buildAdjacencyList(routers, edges);
    assignChannels(routers, adjList);

    // 6. Prepare the Output JSON
    json output;
    output["routers"] = json::array();
    for (const auto& r : routers) {
        json r_json;
        r_json["id"] = r.id;
        r_json["channel"] = r.channel;
        output["routers"].push_back(r_json);
    }

    output["edges"] = json::array();
    for (const auto& e : edges) {
        json e_json;
        e_json["routerA"] = e.routerA;
        e_json["routerB"] = e.routerB;
        e_json["distance"] = e.distance;
        e_json["status"] = e.status;
        e_json["interferes"] = e.interferes;
        output["edges"].push_back(e_json);
    }

    // 7. Print the final JSON string to standard output (cout)
    cout << output.dump() << endl;

    return 0;
}