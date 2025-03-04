import React from 'react';
import { Box, Flex, Heading, Spacer, Button, Link } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';

const Header = () => {
  return (
    <Box bg="brand.600" px={4} py={3} color="white">
      <Flex alignItems="center" maxW="container.xl" mx="auto">
        <Heading size="md">Visual RAG Gallery</Heading>
        <Spacer />
        <Link href="https://github.com/Shayan5422/visual-rag" isExternal>
          <Button 
            leftIcon={<FaGithub />} 
            variant="outline" 
            colorScheme="whiteAlpha" 
            size="sm"
          >
            Source Code
          </Button>
        </Link>
      </Flex>
    </Box>
  );
};

export default Header; 