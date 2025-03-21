import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile } from 'fs/promises';
import ffmpeg from 'fluent-ffmpeg';

// Set FFmpeg path if it's not in the system's PATH
ffmpeg.setFfmpegPath('C:/ffmpeg/bin/ffmpeg.exe');

export const config = {
  api: {
    bodyParser: false, // Required for handling multipart form data
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json({ error: 'No video file uploaded' }, { status: 400 });
    }

    // Get the video file name (without extension)
    const videoName = path.parse(videoFile.name).name;
    
    // Define public directory for this video
    const videoDir = path.join(process.cwd(), 'public', videoName);
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }

    // Save the video file
    const videoPath = path.join(videoDir, videoFile.name);
    const buffer = Buffer.from(await videoFile.arrayBuffer());
    await writeFile(videoPath, buffer);

    // Validate the saved file
    const originalSize = videoFile.size;
    const savedSize = fs.statSync(videoPath).size;
    
    if (originalSize !== savedSize) {
      return NextResponse.json({ error: 'File corruption detected' }, { status: 500 });
    }

    // Define the thumbnails directory inside the video folder
    const thumbnailsDir = path.join(videoDir, 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    // Extract thumbnails and generate VTT
    const thumbnails = await extractThumbnails(videoPath, thumbnailsDir);
    await generateVttFile(thumbnails, thumbnailsDir, videoName);

    console.log('Thumbnails and VTT file generated successfully!');
    return NextResponse.json({
      message: `Video uploaded successfully! Thumbnails & VTT are saved in /public/${videoName}/`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error processing the file upload' }, { status: 500 });
  }
}

// Extract thumbnails every 10 seconds
function extractThumbnails(videoPath: string, outputDir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(videoPath)) {
      console.error('❌ Video file not found:', videoPath);
      return reject(new Error('Video file does not exist'));
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const thumbnails: string[] = [];
    const outputPath = path.join(outputDir, 'thumb_%03d.jpg');

    console.log('✅ Running FFmpeg with:', videoPath, outputPath);

    ffmpeg(videoPath)
      .on('start', (cmd) => console.log('FFmpeg command:', cmd))
      .on('error', (err) => {
        console.error('❌ FFmpeg Error:', err.message);
        reject(err);
      })
      .on('end', () => {
        const generatedFiles = fs.readdirSync(outputDir).filter(file => file.endsWith('.jpg'));
        if (generatedFiles.length === 0) {
          console.error('❌ No thumbnails were generated');
          return reject(new Error('No thumbnails were generated'));
        }

        console.log('✅ Thumbnails generated:', generatedFiles);
        resolve(generatedFiles);
      })
      .outputOptions([
        '-vf', 'fps=1/10',
        '-q:v', '2',
      ])
      .output(outputPath)
      .run();
  });
}

// Generate a VTT file for thumbnails
async function generateVttFile(thumbnails: string[], outputDir: string, videoName: string): Promise<void> {
  if (thumbnails.length === 0) {
    console.error('❌ No thumbnails available to write VTT file.');
    return;
  }

  const vttContent: string[] = ['WEBVTT\n'];
  const timeInterval = 10; // 10-second intervals

  thumbnails.forEach((thumb, i) => {
    const startTime = `00:00:${(i * timeInterval).toString().padStart(2, '0')}.000`;
    const endTime = `00:00:${((i + 1) * timeInterval).toString().padStart(2, '0')}.000`;
    
    // Ensure correct file path (remove 'public/' and encode spaces)
    const thumbPath = `/${encodeURIComponent(videoName)}/thumbnails/${path.basename(thumb)}`;
    vttContent.push(`${startTime} --> ${endTime}\nhttp://localhost:3000/${videoName}/thumbnails/${thumb}\n`);
  });

  const vttFilePath = path.join(outputDir, 'thumbnails.vtt');
  fs.writeFileSync(vttFilePath, vttContent.join('\n'), 'utf8');

  console.log('✅ VTT file created:', vttFilePath);
}