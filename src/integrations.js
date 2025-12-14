// Home Assistant and WLED Integration Module

/**
 * Calculate traffic light status for a kid based on task completion
 * @param {Object} kid - Kid object
 * @param {Array} tasks - All tasks for this kid
 * @returns {string} - 'green', 'yellow', or 'red'
 */
export function calculateTrafficLightStatus(kid, tasks) {
  const kidTasks = tasks.filter(t => t.kidId === kid.id && !t.completed)

  if (kidTasks.length === 0) {
    return 'green' // All tasks complete!
  } else if (kidTasks.length <= 2) {
    return 'yellow' // Few tasks remaining
  } else {
    return 'red' // Many tasks pending
  }
}

/**
 * Get RGB color values for traffic light status
 * @param {string} status - 'green', 'yellow', or 'red'
 * @returns {Object} - {r, g, b} values (0-255)
 */
export function getColorFromStatus(status) {
  const colors = {
    green: { r: 0, g: 255, b: 0 },
    yellow: { r: 255, g: 255, b: 0 },
    red: { r: 255, g: 0, b: 0 }
  }
  return colors[status] || colors.red
}

/**
 * Send color to Home Assistant light entity
 * @param {string} haUrl - Home Assistant URL (e.g., http://192.168.1.100:8123)
 * @param {string} haToken - Long-lived access token
 * @param {string} entityId - Entity ID (e.g., light.kids_room)
 * @param {Object} color - {r, g, b} values
 * @returns {Promise}
 */
export async function updateHomeAssistantLight(haUrl, haToken, entityId, color) {
  try {
    const response = await fetch(`${haUrl}/api/services/light/turn_on`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${haToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id: entityId,
        rgb_color: [color.r, color.g, color.b],
        brightness: 255
      })
    })

    if (!response.ok) {
      throw new Error(`HA API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating Home Assistant light:', error)
    throw error
  }
}

/**
 * Send color to WLED device
 * @param {string} wledUrl - WLED device URL (e.g., http://192.168.1.101)
 * @param {Object} color - {r, g, b} values
 * @param {number} segment - WLED segment number (default 0)
 * @returns {Promise}
 */
export async function updateWLEDLight(wledUrl, color, segment = 0) {
  try {
    const response = await fetch(`${wledUrl}/json/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        on: true,
        bri: 255,
        seg: [{
          id: segment,
          col: [[color.r, color.g, color.b]]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`WLED API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating WLED light:', error)
    throw error
  }
}

/**
 * Update all configured lights for all kids
 * @param {Array} kids - All kids
 * @param {Array} tasks - All tasks
 * @param {Object} integrations - Integration settings
 */
export async function syncAllLights(kids, tasks, integrations) {
  const results = []

  for (const kid of kids) {
    const integration = integrations.find(i => i.kidId === kid.id)
    if (!integration || !integration.enabled) continue

    const status = calculateTrafficLightStatus(kid, tasks)
    const color = getColorFromStatus(status)

    try {
      if (integration.type === 'homeassistant') {
        await updateHomeAssistantLight(
          integration.haUrl,
          integration.haToken,
          integration.entityId,
          color
        )
        results.push({ kid: kid.name, status: 'success', color: status })
      } else if (integration.type === 'wled') {
        await updateWLEDLight(
          integration.wledUrl,
          color,
          integration.segment || 0
        )
        results.push({ kid: kid.name, status: 'success', color: status })
      }
    } catch (error) {
      results.push({ kid: kid.name, status: 'error', error: error.message })
    }
  }

  return results
}

/**
 * Test connection to Home Assistant
 * @param {string} haUrl - Home Assistant URL
 * @param {string} haToken - Access token
 * @returns {Promise<boolean>}
 */
export async function testHomeAssistantConnection(haUrl, haToken) {
  try {
    const response = await fetch(`${haUrl}/api/`, {
      headers: {
        'Authorization': `Bearer ${haToken}`
      }
    })
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * Test connection to WLED device
 * @param {string} wledUrl - WLED device URL
 * @returns {Promise<boolean>}
 */
export async function testWLEDConnection(wledUrl) {
  try {
    const response = await fetch(`${wledUrl}/json/info`)
    return response.ok
  } catch (error) {
    return false
  }
}
