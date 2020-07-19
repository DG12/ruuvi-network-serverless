/**
 * Validates an individual sensor data point.
 */
module.exports.validateSensorData = (data) => {
    // Data field existence
    const fields = ['rssi', 'data', 'coordinates', 'timestamp', 'id', 'gwmac'];
    for (let i = 0, len = fields.length; i < len; i++) {
        if (!data.hasOwnProperty(fields[i])) {
            console.debug("Missing '" + fields[i] + "' from data.");
            return false;
        }
    }

    // TODO: Other validation - per row validation
    
    return true;
}

/**
 * Formats the raw sensor data to DynamoDB row format.
 */
module.exports.dynamoFormat = (inputData) => {
    return {
        "SensorId": { "S": inputData.id },
        "MeasurementTimestamp": { "N": inputData.timestamp.toString() },
        "SensorData": { "S": inputData.data },
        "RSSI": { "N": inputData.rssi.toString() },
        "GatewayMac": { "S": inputData.gwmac },
        "GatewayTimestamp": { "S": inputData.received },
        "Coordinates": { "S": inputData.coordinates },
        "ReceivedAt": { "N": Date.now().toString() }
    };
}

/**
 * Formats the raw JSON objects into a batch for DynamoDB.
 */
module.exports.getDynamoBatch = (inputData) => {
    let batch = {
        RequestItems: { }
    };
    batch.RequestItems[process.env.TABLE_NAME] = [];
    
    for (let i = 0, len = inputData.length; i < len; i++) {
        if (!this.validateSensorData(inputData[i])) {
            return null;
        }
        
        batch.RequestItems[process.env.TABLE_NAME].push({
            PutRequest: {
                Item: this.dynamoFormat(inputData[i])
            }
        });
    }

    return batch;
}