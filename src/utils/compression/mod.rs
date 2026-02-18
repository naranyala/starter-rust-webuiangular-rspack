#![allow(dead_code)]
use std::io::{BufReader, Read, Write};

pub struct CompressionUtils;

impl CompressionUtils {
    pub fn compress_gzip(input: &[u8]) -> Result<Vec<u8>, String> {
        let mut encoder = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
        encoder.write_all(input).map_err(|e| e.to_string())?;

        encoder.finish().map_err(|e| e.to_string())
    }

    pub fn decompress_gzip(input: &[u8]) -> Result<Vec<u8>, String> {
        let decoder = flate2::read::GzDecoder::new(input);
        let mut decoder = BufReader::new(decoder);
        let mut result = Vec::new();

        decoder
            .read_to_end(&mut result)
            .map_err(|e| e.to_string())?;

        Ok(result)
    }
}
