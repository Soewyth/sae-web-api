CREATE TABLE
    "CityWeather" (
        "id" TEXT NOT NULL,
        "FK_cityId" TEXT NOT NULL,
        "month" INTEGER NOT NULL,
        "avgTemp" DOUBLE PRECISION NOT NULL,
        "avgPrecip" DOUBLE PRECISION NOT NULL,
        "avgSun" DOUBLE PRECISION NOT NULL,
        CONSTRAINT "CityWeather_pkey" PRIMARY KEY ("id")
    );

ALTER TABLE "CityWeather"
ADD CONSTRAINT "CityWeather_FK_cityId_fkey" FOREIGN KEY ("FK_cityId") REFERENCES "City" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CityWeather_FK_cityId_month_key" ON "CityWeather" ("FK_cityId", "month");