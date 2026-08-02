#pragma once 
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