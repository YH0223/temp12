/**
 * DICOM 이미지 API 엔드포인트
 * GET /api/dicom/instances/{instanceKey}/image
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock DICOM 이미지 데이터 (실제로는 DICOM 파일에서 이미지 추출)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceKey: string }> }
) {
  try {
    const { instanceKey } = await params;

    if (!instanceKey) {
      return NextResponse.json(
        { error: 'instanceKey가 필요합니다.' },
        { status: 400 }
      );
    }

    // Mock 이미지 생성 (실제로는 DICOM 파일에서 픽셀 데이터 추출)
    const imageBuffer = await generateMockDicomImage(instanceKey);

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600', // 1시간 캐시
        'Content-Length': imageBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('DICOM 이미지 API 오류:', error);
    return NextResponse.json(
      { error: '이미지를 생성할 수 없습니다.' },
      { status: 500 }
    );
  }
}

/**
 * Mock DICOM 이미지 생성 함수
 * 실제 환경에서는 DICOM 파일의 픽셀 데이터를 파싱하여 이미지로 변환
 */
async function generateMockDicomImage(instanceKey: string): Promise<Buffer> {
  // Canvas를 사용하여 Mock 의료 이미지 생성
  const { createCanvas } = await import('canvas');
  const canvas = createCanvas(512, 512);
  const ctx = canvas.getContext('2d');

  // 배경 (검은색)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  // instanceKey에 따라 다른 패턴 생성
  const instanceNumber = parseInt(instanceKey.split('-').pop() || '1');
  
  // 그라데이션 배경
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 200);
  gradient.addColorStop(0, '#404040');
  gradient.addColorStop(1, '#101010');
  ctx.fillStyle = gradient;
  ctx.fillRect(50, 50, 412, 412);

  // 의료 이미지 스타일의 원형 구조물 (예: CT 스캔)
  if (instanceKey.includes('001-001')) {
    // CT 흉부 시뮬레이션
    drawChestCT(ctx, instanceNumber);
  } else if (instanceKey.includes('001-002')) {
    // CT 코로날 시뮬레이션  
    drawCoronalCT(ctx, instanceNumber);
  } else if (instanceKey.includes('002-001')) {
    // MRI T1 시뮬레이션
    drawMRI_T1(ctx, instanceNumber);
  } else if (instanceKey.includes('002-002')) {
    // MRI T2 시뮬레이션
    drawMRI_T2(ctx, instanceNumber);
  } else if (instanceKey.includes('002-003')) {
    // MRI FLAIR 시뮬레이션
    drawMRI_FLAIR(ctx, instanceNumber);
  } else {
    // 기본 패턴
    drawDefaultPattern(ctx, instanceNumber);
  }

  // 노이즈 추가 (의료 이미지 특성)
  addMedicalNoise(ctx, 512, 512);

  // 이미지 정보 텍스트
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '12px Arial';
  ctx.fillText(`Instance: ${instanceNumber}`, 10, 25);
  ctx.fillText(`Slice: ${instanceNumber * 5}mm`, 10, 45);

  return canvas.toBuffer('image/png');
}

function drawChestCT(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  const centerX = 256;
  const centerY = 256;
  
  // 흉곽 외곽
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 180, 160, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 폐 영역 (좌측)
  ctx.fillStyle = '#202020';
  ctx.beginPath();
  ctx.ellipse(centerX - 80, centerY, 60, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // 폐 영역 (우측)
  ctx.beginPath();
  ctx.ellipse(centerX + 80, centerY, 60, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // 척추
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(centerX, centerY + 120, 15, 0, Math.PI * 2);
  ctx.fill();

  // 심장 (특정 슬라이스에서만)
  if (sliceNumber > 20 && sliceNumber < 40) {
    ctx.fillStyle = '#606060';
    ctx.beginPath();
    ctx.ellipse(centerX - 30, centerY, 30, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCoronalCT(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  const centerX = 256;
  const centerY = 256;
  
  // 신체 외곽
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 150, 200, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 폐 영역
  ctx.fillStyle = '#202020';
  ctx.fillRect(centerX - 100, centerY - 100, 200, 120);

  // 횡격막
  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY + 20, 120, Math.PI, 0);
  ctx.stroke();
}

function drawMRI_T1(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  const centerX = 256;
  const centerY = 256;
  
  // 뇌 외곽
  ctx.fillStyle = '#505050';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 140, 160, 0, 0, Math.PI * 2);
  ctx.fill();

  // 뇌실
  ctx.fillStyle = '#202020';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 20, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // 회질
  ctx.strokeStyle = '#707070';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 130, 150, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawMRI_T2(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  const centerX = 256;
  const centerY = 256;
  
  // 뇌 외곽 (T2에서는 더 밝음)
  ctx.fillStyle = '#707070';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 140, 160, 0, 0, Math.PI * 2);
  ctx.fill();

  // 뇌실 (T2에서는 매우 밝음)
  ctx.fillStyle = '#C0C0C0';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 20, 30, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMRI_FLAIR(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  const centerX = 256;
  const centerY = 256;
  
  // 뇌 외곽
  ctx.fillStyle = '#606060';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 140, 160, 0, 0, Math.PI * 2);
  ctx.fill();

  // 뇌실 (FLAIR에서는 어둡게)
  ctx.fillStyle = '#101010';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, 20, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  // 백질 병변 시뮬레이션
  if (sliceNumber > 30 && sliceNumber < 50) {
    ctx.fillStyle = '#A0A0A0';
    ctx.beginPath();
    ctx.arc(centerX + 50, centerY - 30, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDefaultPattern(ctx: CanvasRenderingContext2D, sliceNumber: number) {
  // 기본 패턴
  ctx.strokeStyle = '#606060';
  ctx.lineWidth = 2;
  
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(256, 256, 50 + i * 30, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function addMedicalNoise(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 노이즈 추가 (의료 이미지의 특성)
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));     // R
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)); // G
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}
