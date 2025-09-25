import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function MapComponent({ 
  center = [23.8103, 90.4125], // Default to Dhaka, Bangladesh
  zoom = 13,
  onLocationSelect,
  selectedLocation = null,
  height = 400,
  style = {}
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapInstanceRef.current);

    // Add click event to map
    mapInstanceRef.current.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current);
      
      // Call the callback immediately with coordinates to show loading state
      if (onLocationSelect) {
        onLocationSelect({
          lat,
          lng,
          address: '',
          isLoading: true
        });
      }
      
      // Get the actual location name using reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        let address = data.display_name || `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        
        // Try to get a more user-friendly name
        if (data.address) {
          const addr = data.address;
          if (addr.suburb || addr.neighbourhood) {
            address = addr.suburb || addr.neighbourhood;
            if (addr.city || addr.town) {
              address += `, ${addr.city || addr.town}`;
            }
          } else if (addr.city || addr.town) {
            address = addr.city || addr.town;
            if (addr.state) {
              address += `, ${addr.state}`;
            }
          } else if (addr.road) {
            address = `${addr.road}`;
            if (addr.city || addr.town) {
              address += `, ${addr.city || addr.town}`;
            }
          }
        }
        
        // Call the callback with selected location
        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            address: address,
            isLoading: false
          });
        }
      } catch (error) {
        // Fallback to coordinates if geocoding fails
        if (onLocationSelect) {
          onLocationSelect({
            lat,
            lng,
            address: `Location at ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      }
    });

    // Add current location button
    const locationButton = L.control({ position: 'topright' });
    locationButton.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <button 
          style="
            width: 30px; 
            height: 30px; 
            background: white; 
            border: 2px solid rgba(0,0,0,0.2); 
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          "
          title="Use current location"
        >
          📍
        </button>
      `;
      
      div.onclick = async () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              // Remove existing marker
              if (markerRef.current) {
                mapInstanceRef.current.removeLayer(markerRef.current);
              }

              // Add new marker
              markerRef.current = L.marker([latitude, longitude]).addTo(mapInstanceRef.current);
              
              // Center map on current location
              mapInstanceRef.current.setView([latitude, longitude], 15);
              
              // Get the actual location name using reverse geocoding
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                );
                const data = await response.json();
                
                let address = data.display_name || `Current location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`;
                
                // Try to get a more user-friendly name
                if (data.address) {
                  const addr = data.address;
                  if (addr.suburb || addr.neighbourhood) {
                    address = addr.suburb || addr.neighbourhood;
                    if (addr.city || addr.town) {
                      address += `, ${addr.city || addr.town}`;
                    }
                  } else if (addr.city || addr.town) {
                    address = addr.city || addr.town;
                    if (addr.state) {
                      address += `, ${addr.state}`;
                    }
                  } else if (addr.road) {
                    address = `${addr.road}`;
                    if (addr.city || addr.town) {
                      address += `, ${addr.city || addr.town}`;
                    }
                  }
                }
                
                // Call the callback
                if (onLocationSelect) {
                  onLocationSelect({
                    lat: latitude,
                    lng: longitude,
                    address: address,
                    isLoading: false
                  });
                }
              } catch (error) {
                // Fallback to coordinates if geocoding fails
                if (onLocationSelect) {
                  onLocationSelect({
                    lat: latitude,
                    lng: longitude,
                    address: `Current location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
                    isLoading: false
                  });
                }
              }
            },
            (error) => {
              alert('Could not get your location. Please select manually.');
            }
          );
        } else {
          alert('Geolocation is not supported by this browser.');
        }
      };
      
      return div;
    };
    locationButton.addTo(mapInstanceRef.current);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [center, zoom, onLocationSelect]);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (mapInstanceRef.current && selectedLocation && selectedLocation.lat && selectedLocation.lng) {
      // Remove existing marker
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
      }

      // Add new marker
      markerRef.current = L.marker([selectedLocation.lat, selectedLocation.lng]).addTo(mapInstanceRef.current);
      
      // Center map on selected location with smooth animation
      mapInstanceRef.current.flyTo([selectedLocation.lat, selectedLocation.lng], 15, {
        duration: 1
      });
    }
  }, [selectedLocation]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        height, 
        width: '100%', 
        borderRadius: '8px',
        ...style
      }} 
    />
  );
}
