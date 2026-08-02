#pragma once
#include <vector>
#include <unordered_map>
#include <iostream>
#include "models.h"
#include "physics.h"

using namespace std;

struct RouterEdge {
    int routerA;
    int routerB;
    double distance;  // meters
    string status;    // "Interference (Dist < Radii)" | "Blocked by Wall"
    bool interferes;  // true = counts as a real channel conflict
};

vector<RouterEdge> computeEdges(const vector<Router>& routers, const vector<Wall>& walls) {
    vector<RouterEdge> edges;
    int n = static_cast<int>(routers.size());

    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            EdgeResult res = computeEdge(routers[i], routers[j], walls);
            if (res.status == "Clear") continue;

            RouterEdge e;
            e.routerA = routers[i].id;
            e.routerB = routers[j].id;
            e.distance = res.distanceMeters;
            e.status = res.status;
            e.interferes = res.exists;
            edges.push_back(e);
        }
    }

    return edges;
}


vector<vector<int>> buildAdjacencyList(const vector<Router>& routers, const vector<RouterEdge>& edges) {
    int n = static_cast<int>(routers.size());
    vector<vector<int>> adjList(n);

    unordered_map<int, int> idToIndex;
    for (int i = 0; i < n; i++) {
        idToIndex[routers[i].id] = i;
    }

    for (const auto& e : edges) {
        if (!e.interferes) continue;
        int a = idToIndex[e.routerA];
        int b = idToIndex[e.routerB];
        adjList[a].push_back(b);
        adjList[b].push_back(a);
    }

    return adjList;
}

// Greedy Graph Coloring Algorithm (unchanged from before)
void assignChannels(vector<Router>& routers, const vector<vector<int>>& adjList) {
    // The only 3 non-overlapping channels in 2.4GHz Wi-Fi
    vector<int> availableChannels = {1, 6, 11};
    int n = static_cast<int>(routers.size());

    for (int i = 0; i < n; i++) {
        vector<bool> usedChannels(12, false);

        for (int neighbor : adjList[i]) {
            int neighborChannel = routers[neighbor].channel;
            if (neighborChannel != 0) {
                usedChannels[neighborChannel] = true;
            }
        }

        for (int ch : availableChannels) {
            if (!usedChannels[ch]) {
                routers[i].channel = ch;
                break;
            }
        }

        if (routers[i].channel == 0) {
            routers[i].channel = 1;
        }
    }
}