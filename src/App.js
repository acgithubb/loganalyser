import React, { useEffect, useState, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import s3 from './aws-config';
import './App.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import MainLogo from './images/dd-log-10-years.png'

Chart.register(...registerables);

const FileUploader = ({ onFileUploaded, setLoading }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      setLoading(true); // Set loading to true when the user clicks on "Upload"
      const params = {
        Bucket: 'react-accesslogs', // Replace with your S3 bucket name
        Key: selectedFile.name,
        Body: selectedFile,
      };

      s3.upload(params, (error, data) => {
        if (error) {
          console.error(error);
        } else {
          console.log('File uploaded successfully!', data.Location);
          onFileUploaded(data.Location);
        }
        setLoading(false); // Set loading to false after the upload process is done
      });
    }
  };

  return (
    <div className='chooose-file'>
      <input type="file" onChange={handleFileChange} />
      <button className='' onClick={handleUpload}>Upload</button>
    </div>
  );
};

const LogChart = () => {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const [logData, setLogData] = useState([]);
  const [objectURL, setObjectURL] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state

  const handleFileUploaded = (objectURL) => {
    setObjectURL(objectURL);
  };

  const handleStartDateChange = (date) => {
    setSelectedStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setSelectedEndDate(date);
  };

  const handleDateSelection = () => {
    if (objectURL && selectedStartDate && selectedEndDate) {
      fetchLogData(objectURL, selectedStartDate, selectedEndDate);
    }
  };

  const handleShowAll = () => {
    if (objectURL) {
      fetchLogData(objectURL);
    }
  };

  const fetchLogData = async (objectURL, startDate = null, endDate = null) => {
    try {
      setLoading(true); // Set loading to true when fetching log data
      const response = await fetch(objectURL);
      const text = await response.text();
      console.log('Fetched log data:', text); // Log the fetched data
      const lines = text.split('\n');
      const errorCodes = {};

      lines.forEach((line) => {
        const matches = line.match(/\[(\d{2}\/[A-Za-z]+\/\d{4}):(\d{2}:\d{2}:\d{2})/);
        if (matches && matches.length === 3) {
          const [date, time] = matches.slice(1);
          const dateTime = new Date(`${date} ${time} UTC`);
          if (
            (!startDate || dateTime >= startDate) &&
            (!endDate || dateTime <= endDate)
          ) {
            const errorCode = line.match(/HTTP\/1.1" (\d+)/);
            if (errorCode && errorCode.length > 1) {
              const code = errorCode[1];
              errorCodes[code] = (errorCodes[code] || 0) + 1;
            }
          }
        }
      });

      console.log('Parsed log data:', errorCodes); // Log the parsed data
      setLogData(errorCodes);
    } catch (error) {
      console.error('Error fetching log data:', error);
    } finally {
      setLoading(false); // Set loading to false after fetching the log data
    }
  };

  useEffect(() => {
    if (objectURL && (!selectedStartDate || selectedEndDate)) {
      fetchLogData(objectURL, selectedStartDate, selectedEndDate);
    }
  }, [objectURL, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    if (barChartRef.current && Object.keys(logData).length > 0 && !loading) {
      const ctx = barChartRef.current.getContext('2d');
      const labels = Object.keys(logData);
      const data = Object.values(logData);

      const barChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'HTTP Codes',
              data,
              backgroundColor: labels.map((code) => {
                if (code.startsWith('2')) return 'rgba(0, 128, 0, 0.6)';
                if (code.startsWith('3')) return 'rgba(255, 255, 0, 0.6)';
                if (code.startsWith('4')) return 'rgba(255, 0, 0, 0.6)';
                return 'rgba(75, 192, 192, 0.6)';
              }),
              borderColor: labels.map((code) => {
                if (code.startsWith('2')) return 'rgba(0, 128, 0, 1)';
                if (code.startsWith('3')) return 'rgba(255, 255, 0, 1)';
                if (code.startsWith('4')) return 'rgba(255, 0, 0, 1)';
                return 'rgba(75, 192, 192, 1)';
              }),
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              precision: 0,
            },
          },
        },
      });

      // Clear chart on component unmount
      return () => {
        barChart.destroy();
      };
    }
  }, [logData, loading]);

  useEffect(() => {
    if (pieChartRef.current && Object.keys(logData).length > 0 && !loading) {
      const ctx = pieChartRef.current.getContext('2d');
      const labels = Object.keys(logData);
      const data = Object.values(logData);

      const pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: labels.map((code) => {
                if (code.startsWith('2')) return 'rgba(0, 128, 0, 0.6)';
                if (code.startsWith('3')) return 'rgba(255, 255, 0, 0.6)';
                if (code.startsWith('4')) return 'rgba(255, 0, 0, 0.6)';
                return 'rgba(75, 192, 192, 0.6)';
              }),
              borderColor: labels.map((code) => {
                if (code.startsWith('2')) return 'rgba(0, 128, 0, 1)';
                if (code.startsWith('3')) return 'rgba(255, 255, 0, 1)';
                if (code.startsWith('4')) return 'rgba(255, 0, 0, 1)';
                return 'rgba(75, 192, 192, 1)';
              }),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: 'HTTP Code Distribution',
            },
          },
          layout: {
            padding: {
              left: 10,
              right: 10,
              top: 10,
              bottom: 10,
            },
          },
        },
      });

      // Clear chart on component unmount
      return () => {
        pieChart.destroy();
      };
    }
  }, [logData, loading]);

  return (
    <>
    <header className='header'>
      <div className='logo'>
        <a href='/'><img src={MainLogo} alt='' /></a>
      </div>
      <div className='file-uploader'>
        <FileUploader onFileUploaded={handleFileUploaded} setLoading={setLoading} />

        {/* Date Selector */}
        {objectURL && (
          <div className='date-range-select'>
            <h3>Select Date Range:</h3>
            <div className='date-start-select'>
              <label>Start Date:</label>
              <DatePicker selected={selectedStartDate} onChange={handleStartDateChange} />
            </div>
            <div className='date-end-select'>
              <label>End Date:</label>
              <DatePicker selected={selectedEndDate} onChange={handleEndDateChange} />
            </div>
            <button className='' onClick={handleDateSelection}>Generate Graph</button>
            <button className='' onClick={handleShowAll}>Show All Logs</button>
          </div>
        )}
      </div>
    </header>
    <div className=''>
      <div className=''>

      </div>
      <div className="dashboard"> 
          {/* Graphs */}
          {!loading && (
            <div className="flex">
              <div className="flex-auto w-full">
                <div className="flex gap-8 flex-wrap">
                  <div className="flex-none w-full page-head font-semibold text-gray-900">
                    <h3>HTTP Codes</h3>
                  </div>
                  <div className="flex-auto w-64 ml-3">
                    <div className="rounded shadow-lg bg-slate-50 p-5 ml-3 height:full">
                      <canvas ref={barChartRef} />
                    </div>
                  </div>
                  <div className="flex-auto w-32 mr-3">
                    <div className="rounded shadow-lg bg-slate-50 p-5 mr-3 height:full">
                      <canvas
                        ref={pieChartRef}
                        style={{ width: '50%', margin: '0 auto' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
    </div> 
    </>
  );
};

export default LogChart;
