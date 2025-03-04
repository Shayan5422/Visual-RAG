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
  HStack,
  Wrap,
  WrapItem,
  Image,
  CloseButton,
} from '@chakra-ui/react';
import { FaUpload, FaImage } from 'react-icons/fa';
import axios from 'axios';

const ImageUploader = ({ onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const toast = useToast();

  const onDrop = useCallback(async (acceptedFiles) => {
    // Filter out non-image files
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload image files only.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Update the selected files
    setSelectedFiles(prev => [...prev, ...imageFiles]);
  }, [toast]);
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select at least one image to upload.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
      
      const uploadedImages = [];
      
      // Upload each image sequentially
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload image to server
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        uploadedImages.push(response.data);
      }
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component with all uploaded images
      uploadedImages.forEach(image => onImageUploaded(image));
      
      // Reset uploader after a delay
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        setSelectedFiles([]);
      }, 1000);
      
      toast({
        title: 'Upload successful',
        description: `Successfully uploaded ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error uploading images:', error);
      
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'Failed to upload the images.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
    },
    multiple: true,
    disabled: uploading,
  });
  
  return (
    <VStack spacing={4} align="stretch">
      <Text fontWeight="bold" fontSize="lg">
        Upload New Images
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
                {isDragActive ? 'Drop the images here' : 'Drag & drop images here'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                or click to browse
              </Text>
            </>
          )}
        </VStack>
      </Box>

      {selectedFiles.length > 0 && (
        <Box borderWidth={1} borderRadius="md" p={2}>
          <Text fontWeight="medium" mb={2}>
            Selected images: {selectedFiles.length}
          </Text>
          <Wrap spacing={2}>
            {selectedFiles.map((file, index) => (
              <WrapItem key={index}>
                <Box position="relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index}`}
                    boxSize="80px"
                    objectFit="cover"
                    borderRadius="md"
                  />
                  <CloseButton
                    size="sm"
                    position="absolute"
                    top={-2}
                    right={-2}
                    bg="red.500"
                    color="white"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    disabled={uploading}
                  />
                </Box>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      )}
      
      {uploading && (
        <Progress
          value={uploadProgress}
          size="sm"
          colorScheme="brand"
          borderRadius="full"
          isAnimated
        />
      )}
      
      <HStack>
        <Button
          leftIcon={<FaUpload />}
          colorScheme="brand"
          isDisabled={uploading}
          onClick={() => document.getElementById('fileInput').click()}
          flex="1"
        >
          Select Images
        </Button>
        <Button
          colorScheme="green"
          isDisabled={uploading || selectedFiles.length === 0}
          onClick={uploadImages}
          flex="1"
        >
          Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
        </Button>
      </HStack>
      <input
        type="file"
        id="fileInput"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onDrop(Array.from(e.target.files));
          }
        }}
      />
    </VStack>
  );
};

export default ImageUploader; 