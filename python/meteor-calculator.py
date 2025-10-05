import numpy as np

def julian_date(year, month, day):
    # Simple JD converter (for demonstration)
    if month <= 2:
        year -= 1
        month += 12
    A = int(year/100)
    B = 2 - A + int(A/4)
    return int(365.25*(year+4716)) + int(30.6001*(month+1)) + day + B - 1524.5

def kepler_equation(M, e, tol=1e-6):
    E = M
    while True:
        dE = (E - e*np.sin(E) - M) / (1 - e*np.cos(E))
        E -= dE
        if abs(dE) < tol:
            break
    return E

def get_meteor_position(jd, elements):
    # Unpack elements
    a = float(elements['semi_major_axis'])  # AU
    e = float(elements['eccentricity'])
    i = np.radians(float(elements['inclination']))
    Omega = np.radians(float(elements['ascending_node_longitude']))
    w = np.radians(float(elements['perihelion_argument']))
    M0 = np.radians(float(elements['mean_anomaly']))
    epoch = float(elements['epoch_osculation'])
    n = 2 * np.pi / float(elements['orbital_period'])  # rad/day

    # Mean anomaly at jd
    M = M0 + n * (jd - epoch)
    M = M % (2 * np.pi)

    # Solve Kepler's equation
    E = kepler_equation(M, e)

    # Position in orbital plane
    x_prime = a * (np.cos(E) - e)
    y_prime = a * np.sqrt(1 - e**2) * np.sin(E)
    z_prime = 0

    # Rotate to ecliptic coordinates
    # 1. Argument of perihelion
    x1 = x_prime * np.cos(w) - y_prime * np.sin(w)
    y1 = x_prime * np.sin(w) + y_prime * np.cos(w)
    z1 = z_prime

    # 2. Inclination
    x2 = x1
    y2 = y1 * np.cos(i) - z1 * np.sin(i)
    z2 = y1 * np.sin(i) + z1 * np.cos(i)

    # 3. Longitude of ascending node
    x = x2 * np.cos(Omega) - y2 * np.sin(Omega)
    y = x2 * np.sin(Omega) + y2 * np.cos(Omega)
    z = z2

    return x, y, z  # in AU

earth_elements = {
    "semi_major_axis": "1.00000011",
    "eccentricity": "0.01671022",
    "inclination": "0.00005",
    "ascending_node_longitude": "-11.26064",
    "perihelion_argument": "102.94719",
    "mean_anomaly": "100.46435",
    "epoch_osculation": "2451545.0",
    "orbital_period": "365.256363004"
}
def get_geocentric_position(jd, meteor_elements):
    meteor_xyz = np.array(get_meteor_position(jd, meteor_elements))
    earth_xyz = np.array(get_meteor_position(jd, earth_elements))
    geo_xyz = meteor_xyz - earth_xyz
    return tuple(geo_xyz)

