import streamlit as st
import dashscope

# Set the base URL for the DashScope API (Singapore region)
dashscope.base_http_api_url = 'https://dashscope-intl.aliyuncs.com/api/v1'

# --- Streamlit App Interface ---
st.title("Qwen Chat Assistant powered by DashScope")
st.markdown("Enter your message below to chat with the Qwen model.")

# 1. Input for API Key (Consider using st.secrets for deployment)
api_key = st.text_input("Enter your DashScope API Key:", type="password")
if not api_key:
    st.info("Please enter your API key to continue.")
    st.stop() # Stop execution until API key is provided

# 2. Input for the user's message
user_input = st.text_area("Your message:", "can you help me write a poem about the sea?")

# 3. Button to trigger the API call
if st.button("Send Message"):
    if not user_input.strip():
        st.warning("Please enter a message.")
    else:
        # Define the messages for the API call
        messages = [
            {'role': 'system', 'content': 'You are a helpful assistant.'},
            {'role': 'user', 'content': user_input}
        ]

        try:
            # Make the API call using the provided API key
            response = dashscope.Generation.call(
                api_key=api_key,  # Use the key entered by the user
                model="qwen-plus", # You can change the model if needed
                messages=messages,
                result_format='message'
            )

            # 4. Display the response
            if response.status_code == 200: # Check if the API call was successful
                # Extract the model's reply
                assistant_reply = response.output.choices[0]['message']['content']
                st.subheader("Response from Qwen:")
                st.write(assistant_reply)
                
                # Optional: Display raw response for debugging
                # st.json(response)
            else:
                # Handle potential errors returned by the API
                st.error(f"API call failed. Status Code: {response.status_code}")
                st.error(f"Error Message: {response.message}")

        except Exception as e:
            # Handle other potential errors (e.g., network issues)
            st.error(f"An error occurred: {e}")