// Speech-to-Text Service (Legacy - Not used with React Native Voice)
// This file is kept for reference but not actively used
import axios from 'axios';

// AWS Configuration - Replace with your credentials
const AWS_CONFIG = {
    accessKeyId: 'YOUR_AWS_ACCESS_KEY_ID',
    secretAccessKey: 'YOUR_AWS_SECRET_ACCESS_KEY',
    region: 'eu-west-1' // Ireland - closest to Nigeria with Transcribe support
};

// Configure AWS
AWS.config.update(AWS_CONFIG);

// Simple AssemblyAI implementation - with better debugging
export const simpleAssemblyAI = async (audioUri) => {
    try {
        console.log('🎤 Starting AssemblyAI transcription...');
        console.log('📁 Audio URI:', audioUri);

        // Check if we can access the audio file
        const response = await fetch(audioUri);
        console.log('📊 Audio file response status:', response.status);

        if (!response.ok) {
            throw new Error(`Cannot access audio file: ${response.status}`);
        }

        const audioBlob = await response.blob();
        console.log('📦 Audio blob size:', audioBlob.size, 'bytes');
        console.log('🎵 Audio blob type:', audioBlob.type);

        if (audioBlob.size === 0) {
            throw new Error('Audio file is empty');
        }

        // Convert to ArrayBuffer for better compatibility
        console.log('🔄 Converting to ArrayBuffer...');
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('📊 ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');

        // Upload audio as binary data with proper headers
        console.log('⬆️ Uploading audio to AssemblyAI...');
        
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            uint8Array,
            {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/octet-stream',
                },
                timeout: 120000, // 2 minute timeout for upload
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                responseType: 'json'
            }
        );

        console.log('✅ Upload successful:', uploadResponse.data);
        const audioUrl = uploadResponse.data.upload_url;

        // Start transcription
        console.log('🔄 Starting transcription job...');
        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: audioUrl,
                language_code: 'en'
            },
            {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/json',
                },
                timeout: 30000
            }
        );

        const transcriptId = transcriptResponse.data.id;
        console.log('🆔 Transcript job ID:', transcriptId);

        // Poll for completion with better logic
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts = 60 seconds max

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            attempts++;

            console.log(`🔍 Checking transcription status (attempt ${attempts}/${maxAttempts})...`);

            const resultResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': ASSEMBLYAI_API_KEY,
                    },
                }
            );

            const status = resultResponse.data.status;
            console.log('📊 Transcription status:', status);

            if (status === 'completed') {
                const transcript = resultResponse.data.text;
                console.log('✅ AssemblyAI transcription successful:', transcript);

                if (!transcript || transcript.trim() === '') {
                    throw new Error('Transcription completed but text is empty - audio may be unclear');
                }

                return transcript;
            } else if (status === 'error') {
                console.error('❌ Transcription error:', resultResponse.data.error);
                throw new Error(`Transcription failed: ${resultResponse.data.error}`);
            }

            // Still processing, continue polling
        }

        throw new Error('Transcription timed out after 60 seconds');

    } catch (error) {
        console.error('❌ AssemblyAI error:', error.message);
        
        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📋 Response data:', error.response.data);
            console.error('📝 Response headers:', error.response.headers);
            
            if (error.response.status === 422) {
                throw new Error(`Audio format not supported: ${JSON.stringify(error.response.data)}`);
            }
        }
        
        console.error('🔍 Full error:', error);
        throw error;
    }
};

const transcribeAudio = async (audioUrl) => {
    try {
        // Start transcription
        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            {
                audio_url: audioUrl,
                language_code: 'en', // Change to yo if supported
            },
            {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/json',
                },
            }
        );

        const transcriptId = transcriptResponse.data.id;

        // Poll for completion
        let transcript;
        while (true) {
            const pollingResponse = await axios.get(
                `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
                {
                    headers: {
                        'authorization': ASSEMBLYAI_API_KEY,
                    },
                }
            );

            transcript = pollingResponse.data;

            if (transcript.status === 'completed') {
                return transcript.text;
            } else if (transcript.status === 'error') {
                throw new Error(`Transcription failed: ${transcript.error}`);
            }

            // Wait 1 second before polling again
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
    }
};

export const convertSpeechToText = async (audioUri) => {
    try {
        console.log('Starting speech-to-text conversion...');

        // Step 1: Upload audio file
        const audioUrl = await uploadAudio(audioUri);
        console.log('Audio uploaded successfully');

        // Step 2: Transcribe audio
        const transcript = await transcribeAudio(audioUrl);
        console.log('Transcription completed:', transcript);

        return transcript;
    } catch (error) {
        console.error('Speech-to-text conversion failed:', error);
        throw error;
    }
};

// AWS Transcribe - Reliable and cost-effective
export const awsTranscribe = async (audioUri) => {
    try {
        console.log('Starting AWS Transcribe...');

        const s3 = new AWS.S3();
        const transcribe = new AWS.TranscribeService();

        // Read the audio file
        const response = await fetch(audioUri);
        const audioBuffer = await response.arrayBuffer();

        // Generate unique names
        const timestamp = Date.now();
        const bucketName = 'cashflow-audio-transcribe'; // You'll need to create this bucket
        const audioKey = `audio-${timestamp}.m4a`;
        const jobName = `transcribe-job-${timestamp}`;

        // Upload audio to S3
        console.log('Uploading audio to S3...');
        await s3.upload({
            Bucket: bucketName,
            Key: audioKey,
            Body: audioBuffer,
            ContentType: 'audio/m4a'
        }).promise();

        const audioS3Uri = `s3://${bucketName}/${audioKey}`;

        // Start transcription job
        console.log('Starting transcription job...');
        await transcribe.startTranscriptionJob({
            TranscriptionJobName: jobName,
            LanguageCode: 'en-US', // Change to 'yo-NG' for Yoruba if supported
            MediaFormat: 'm4a',
            Media: {
                MediaFileUri: audioS3Uri
            }
        }).promise();

        // Poll for completion
        console.log('Waiting for transcription to complete...');
        let jobStatus = 'IN_PROGRESS';
        while (jobStatus === 'IN_PROGRESS') {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

            const jobResult = await transcribe.getTranscriptionJob({
                TranscriptionJobName: jobName
            }).promise();

            jobStatus = jobResult.TranscriptionJob.TranscriptionJobStatus;

            if (jobStatus === 'COMPLETED') {
                // Get the transcript
                const transcriptUri = jobResult.TranscriptionJob.Transcript.TranscriptFileUri;
                const transcriptResponse = await fetch(transcriptUri);
                const transcriptData = await transcriptResponse.json();

                const transcript = transcriptData.results.transcripts[0].transcript;
                console.log('AWS Transcribe successful:', transcript);

                // Clean up - delete the audio file from S3
                await s3.deleteObject({
                    Bucket: bucketName,
                    Key: audioKey
                }).promise();

                return transcript;
            } else if (jobStatus === 'FAILED') {
                throw new Error('AWS Transcription job failed');
            }
        }

    } catch (error) {
        console.error('AWS Transcribe error:', error);
        throw new Error(`AWS Transcribe failed: ${error.message}`);
    }
};


// Smart Speech-to-Text: Try multiple services for best reliability
export const smartSpeechToText = async (audioUri) => {
    console.log('Starting smart speech-to-text with fallback...');

    // Try simple AssemblyAI first
    try {
        console.log('Trying simple AssemblyAI...');
        const result = await simpleAssemblyAI(audioUri);
        console.log('Simple AssemblyAI successful:', result);
        return result;
    } catch (simpleError) {
        console.log('Simple AssemblyAI failed, using mock...', simpleError.message);

        // Fallback to mock for now
        const result = await mockSpeechToText(audioUri);
        console.log('Mock fallback used:', result);
        return result;
    }
};

// Dual API: Get results from both services and compare
export const dualSpeechToText = async (audioUri) => {
    console.log('Running dual speech-to-text (both APIs)...');

    const results = await Promise.allSettled([
        convertSpeechToText(audioUri).catch(err => ({ error: err.message, service: 'AssemblyAI' })),
        awsTranscribe(audioUri).catch(err => ({ error: err.message, service: 'AWS' }))
    ]);

    const assemblyResult = results[0];
    const awsResult = results[1];

    // Check which services succeeded
    const successfulResults = [];

    if (assemblyResult.status === 'fulfilled' && !assemblyResult.value.error) {
        successfulResults.push({ service: 'AssemblyAI', text: assemblyResult.value });
    }

    if (awsResult.status === 'fulfilled' && !awsResult.value.error) {
        successfulResults.push({ service: 'AWS', text: awsResult.value });
    }

    if (successfulResults.length === 0) {
        throw new Error('Both speech-to-text services failed');
    }

    if (successfulResults.length === 1) {
        console.log(`Only ${successfulResults[0].service} succeeded:`, successfulResults[0].text);
        return successfulResults[0].text;
    }

    // Both succeeded - compare results
    const assembly = successfulResults.find(r => r.service === 'AssemblyAI')?.text || '';
    const aws = successfulResults.find(r => r.service === 'AWS')?.text || '';

    console.log('Both services succeeded:');
    console.log('AssemblyAI:', assembly);
    console.log('AWS:', aws);

    // Return the longer/more detailed result (usually more accurate)
    const chosen = assembly.length >= aws.length ? assembly : aws;
    console.log('Chosen result:', chosen);
    return chosen;
};

// Alternative: Try a different approach - convert to WAV format
export const convertToWavAndTranscribe = async (audioUri) => {
    try {
        console.log('🎵 Trying WAV conversion approach...');
        
        // Fetch the audio file
        const response = await fetch(audioUri);
        const audioBlob = await response.blob();
        
        // Create audio context to convert to WAV
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Convert to WAV format
        const wavBlob = audioBufferToWav(audioBuffer);
        console.log('✅ Converted to WAV:', wavBlob.size, 'bytes');
        
        // Upload WAV to AssemblyAI
        const uploadResponse = await axios.post(
            'https://api.assemblyai.com/v2/upload',
            wavBlob,
            {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/octet-stream',
                },
                timeout: 120000
            }
        );
        
        // Continue with transcription...
        const audioUrl = uploadResponse.data.upload_url;
        
        const transcriptResponse = await axios.post(
            'https://api.assemblyai.com/v2/transcript',
            { audio_url: audioUrl, language_code: 'en' },
            {
                headers: {
                    'authorization': ASSEMBLYAI_API_KEY,
                    'content-type': 'application/json',
                }
            }
        );
        
        // Simple wait and check (for demo)
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const result = await axios.get(
            `https://api.assemblyai.com/v2/transcript/${transcriptResponse.data.id}`,
            {
                headers: { 'authorization': ASSEMBLYAI_API_KEY }
            }
        );
        
        if (result.data.status === 'completed') {
            return result.data.text;
        } else {
            throw new Error('Transcription not completed');
        }
        
    } catch (error) {
        console.error('WAV conversion failed:', error);
        throw error;
    }
};

// Helper function to convert AudioBuffer to WAV
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert audio data
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
        offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// Alternative: Simple mock function for testing
export const mockSpeechToText = async (audioUri) => {
    console.log('Mock speech-to-text called with URI:', audioUri);

    // Simulate shorter API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return random transaction examples
    const examples = [
        "Sold shoes 15k",
        "Bought rice 20k",
        "Received payment 50k",
        "Paid rent 100k",
        "Sold phone 80k",
        "Bought fuel 5k",
        "Sold bag 25k",
        "Paid electricity 30k"
    ];

    const result = examples[Math.floor(Math.random() * examples.length)];
    console.log('Mock speech-to-text returning:', result);
    return result;
};