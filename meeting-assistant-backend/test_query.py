import requests

url = "http://127.0.0.1:8000/query_summary"
query_payload = {
    "query": "Summarize the discussion about marketing strategy"
}

response = requests.post(url, json=query_payload)

# Print full debug info
print("Status Code:", response.status_code)
print("Response Text:", response.text)  # This will show the raw output
