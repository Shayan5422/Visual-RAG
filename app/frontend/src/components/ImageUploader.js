import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Text,
  VStack,
  useToast,
  Progress,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { FaUpload, FaImage } from 'react-icons/fa';
import axios from 'axios';

const ImageUploader = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    // Only accept image files
    const file = acceptedFiles[0];
    
    if (!file) {
      return;
    }
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Upload image to server
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component
      onImageUploaded(response.data);
      
      // Reset uploader after a delay
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Error uploading image:', error);
      
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'Failed to upload the image.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setUploading(false);
      setUploadProgress(0);
    }
  }, [toast, onImageUploaded]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: false,
    disabled: uploading,
  });
  
  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="bold" fontSize="lg">
        Upload New Image
      </Text>
      
      <Box
        {...getRootProps()}
        borderWidth={2}
        borderRadius="md"
        borderStyle="dashed"
        borderColor={isDragActive ? 'brand.500' : 'gray.300'}
        bg={isDragActive ? 'brand.50' : 'gray.50'}
        p={4}
        textAlign="center"
        cursor={uploading ? 'not-allowed' : 'pointer'}
        transition="all 0.2s"
        _hover={{
          borderColor: uploading ? 'gray.300' : 'brand.500',
          bg: uploading ? 'gray.50' : 'brand.50',
        }}
      >
        <input {...getInputProps()} />
        
        <VStack spacing={2} py={6}>
          <Icon
            as={uploading ? FaUpload : FaImage}
            boxSize={12}
            color={uploading ? 'brand.500' : 'gray.400'}
            mb={2}
          />
          
          {uploading ? (
            <Text color="brand.500" fontWeight="medium">
              Uploading...
            </Text>
          ) : (
            <>
              <Text fontWeight="medium">
                {isDragActive ? 'Drop the image here' : 'Drag & drop image here'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                or click to browse
              </Text>
            </>
          )}
        </VStack>
      </Box>
      
      {uploading && (
        <Progress
          value={uploadProgress}
          size="sm"
          colorScheme="brand"
          borderRadius="full"
          isAnimated
        />
      )}
      
      <Button
        leftIcon={<FaUpload />}
        colorScheme="brand"
        isDisabled={uploading}
        onClick={() => document.getElementById('fileInput').click()}
      >
        Select Image
      </Button>
      <input
        type="file"
        id="fileInput"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onDrop([e.target.files[0]]);
          }
        }}
      />
    </VStack>
  );
};

export default ImageUploader; 