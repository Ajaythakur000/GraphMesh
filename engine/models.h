#pragma once 
enum MaterialType {
    NONE = 0,
    CONCRETE = 1,
    WOOD = 2,
    GLASS = 3
};

enum BandType {
    BAND_24GHZ = 1,
    BAND_5GHZ = 2
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
    int band; // 1 = 2.4GHz, 2 = 5GHz
};