import { openDb, getStopsAsGeoJSON, getRoutes } from "gtfs";
import config from "../config/gtfs.config.js";

const db = openDb(config)

const getAllRoutes = async(req, res) => {
  try {
    const routes = getRoutes({},[['route_id'],['agency_id'],['route_short_name'],['route_long_name'],['route_desc'],['route_type']],[['route_long_name', 'ASC']]);

    if(!routes) return res.json("No routes available");

    return res.status(200).json(routes);
  } catch (error) {
    throw error
  }
}

const getRoutesById = async(req, res) => {
  
  const calculateCenter = (coordinates) => {
    let totalLat = 0;
    let totalLong = 0;

    for(const coordinate of coordinates){
      totalLong += coordinate[0]
      totalLat += coordinate[1]
    }

    const avgLong = totalLong / coordinates.length;
    const avgLat = totalLat / coordinates.length;

    return [avgLong, avgLat];
  }

  const createLineString = (data) => {
    const stops = data.features.map(point => point.geometry.coordinates);
    const center = calculateCenter(data.features.map(point => point.geometry.coordinates))

    const geometry = {
      type: 'LineString',
      coordinates: stops,
      center: center
    };
  
    return {
      ...data,
      geometry,
    };
  }

  const getRouteType= (route) => {
    if(route[0].route_type == 1){
      return "BUS"
    }
    if(route[0].route_type == 2){
      return "TRAIN"
    }
    if (route[0].route_type === 3) {
      if (/PUJ/.test(route[0].route_id)) {
        return "JEEP";
      }
      return "BUS";
    }
  }

  try {
    const {id} = req.params; 
    const stopsGEO = getStopsAsGeoJSON({route_id: id});
    const route = getRoutes({route_id: id},['route_id', 'route_short_name', 'route_long_name', 'route_desc' , 'route_type'])

    if(!route) return res.json("No routes available");

    const stops = createLineString(stopsGEO)
    const routeType = getRouteType(route); // Assuming getRouteType is a function that returns the route type

    return res.status(200).json({ ...stops, ...route[0], route_type: routeType });
  } catch (error) {
    throw error
  }
}

const searchRoute = async(req, res) => {
  const {q} = req.query

  try {
    const routes = getRoutes({},[['route_id'],['agency_id'],['route_short_name'],['route_long_name'],['route_desc'],['route_type']],[['route_long_name', 'ASC']]);

    const results = routes.filter(item => {
      const longName = item.route_long_name || '';
      const desc = item.route_desc || '';
    
      return longName.toLowerCase().includes(q.toLowerCase()) || desc.toLowerCase().includes(q.toLowerCase());
    });

    if(!results) res.status(200).json('no route matches')

    return res.status(200).json(results)
  } catch (error) {
    throw error
  }
}

export default {getAllRoutes, getRoutesById, searchRoute};