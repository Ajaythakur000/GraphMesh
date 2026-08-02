#pragma once // Ensures this file is only included once during compilation

// FIXED: previously this enum (AIR=0, GLASS=1, CONCRETE=2) did NOT match the
// frontend's material numbering (1=Concrete, 2=Wood, 3=Glass — see
// Sidebar.jsx / WallLine.jsx MATERIAL_CONFIG). That mismatch meant every
// wall was being physically simulated as the WRONG material. This enum now
// mirrors the frontend 1:1.
enum MaterialType {
    NONE = 0,       // no wall / unused
    CONCRETE = 1,   // high attenuation -> hard block (see physics.h)
    WOOD = 2,       // medium attenuation -> reach penalty
    GLASS = 3       // low attenuation -> small reach penalty
};

struct Wall {
    int id;
    double startX;
    double startY;
    double endX;
    double endY;
    MaterialType material;
};

struct Router {
    int id;
    double x;
    double y;
    double z;
    double baseRadius;
    int channel;
};