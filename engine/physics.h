#pragma once
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include "models.h"

using namespace std;

double get3DDistance(const Router& r1, const Router& r2) {
    return sqrt(pow(r2.x - r1.x, 2) + pow(r2.y - r1.y, 2) + pow(r2.z - r1.z, 2));
}

bool onSegment(double px, double py, double qx, double qy, double rx, double ry) {
    return (qx <= max(px, rx) && qx >= min(px, rx) && qy <= max(py, ry) && qy >= min(py, ry));
}

int orientation(double px, double py, double qx, double qy, double rx, double ry) {
    double val = (qy - py) * (rx - qx) - (qx - px) * (ry - qy);
    if (val == 0) return 0;
    return (val > 0) ? 1 : 2;
}

bool doIntersect(const Router& r1, const Router& r2, const Wall& w) {
    double p1x = r1.x, p1y = r1.y, q1x = r2.x, q1y = r2.y;
    double p2x = w.startX, p2y = w.startY, q2x = w.endX, q2y = w.endY;

    int o1 = orientation(p1x, p1y, q1x, q1y, p2x, p2y);
    int o2 = orientation(p1x, p1y, q1x, q1y, q2x, q2y);
    int o3 = orientation(p2x, p2y, q2x, q2y, p1x, p1y);
    int o4 = orientation(p2x, p2y, q2x, q2y, q1x, q1y);

    if (o1 != o2 && o3 != o4) return true;
    if (o1 == 0 && onSegment(p1x, p1y, p2x, p2y, q1x, q1y)) return true;
    if (o2 == 0 && onSegment(p1x, p1y, q2x, q2y, q1x, q1y)) return true;
    if (o3 == 0 && onSegment(p2x, p2y, p1x, p1y, q2x, q2y)) return true;
    if (o4 == 0 && onSegment(p2x, p2y, q1x, q1y, q2x, q2y)) return true;

    return false;
}

// Reach multiplier for materials that DON'T fully block signal.
// CONCRETE is handled separately as a hard block (see computeEdge below),
// it does not use this function.
double getMaterialPenalty(MaterialType material) {
    if (material == GLASS) return 0.85; // low attenuation
    if (material == WOOD) return 0.6;   // medium attenuation
    return 1.0; // NONE / unknown
}

const double PIXELS_PER_METER = 50.0;

struct EdgeResult {
    bool exists;          // true = actual interference (channel conflict candidate)
    double distanceMeters;
    string status;        // "Interference (Dist < Radii)" | "Blocked by Wall" | "Clear"
};

/*!
  Computes the relationship between two routers.

  Rule (as decided for this feature):
  - CONCRETE walls are a HARD BLOCK: if a concrete wall crosses the line between
    the two routers AND they would otherwise be within reach, the link is
    reported as "Blocked by Wall" (exists = false — no channel conflict).
  - WOOD / GLASS walls only reduce effective reach (never fully block).
  - If, after applying wood/glass penalties, the routers are still within
    reach, the link is "Interference (Dist < Radii)" (exists = true).
  - Otherwise (out of range and no concrete block), status is "Clear" and no
    edge should be reported to the frontend (see graph.h).
*/
EdgeResult computeEdge(const Router& r1, const Router& r2, const vector<Wall>& walls) {
    double distPx = get3DDistance(r1, r2);
    double combinedRadius = r1.baseRadius + r2.baseRadius;

    bool conreteBlocked = false;
    double penaltyMultiplier = 1.0;

    for (const auto& w : walls) {
        if (doIntersect(r1, r2, w)) {
            if (w.material == CONCRETE) {
                conreteBlocked = true;
                break; // hard block found, no need to check further walls
            } else {
                penaltyMultiplier *= getMaterialPenalty(w.material);
            }
        }
    }

    EdgeResult result;
    result.distanceMeters = distPx / PIXELS_PER_METER;

    // Only report a concrete block if the routers would have been in range
    // in the first place (no point telling the user about a wall between
    // two routers that are already too far apart).
    if (conreteBlocked && distPx < combinedRadius) {
        result.exists = false;
        result.status = "Blocked by Wall";
        return result;
    }

    double effectiveReach = combinedRadius * penaltyMultiplier;
    if (distPx < effectiveReach) {
        result.exists = true;
        result.status = "Interference (Dist < Radii)";
    } else {
        result.exists = false;
        result.status = "Clear";
    }

    return result;
}